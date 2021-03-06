/**
 * fs.ua plugin for Movian Media Center
 *
 *  Copyright (C) 2015 lprot
 *  Copyright (C) 2016 Marshak Igor (!Joy!)
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

(function(plugin) {
    var logo = plugin.path + "logo.png";

    var folderList = [];

    var service = plugin.createService(plugin.getDescriptor().id, plugin.getDescriptor().id + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);
    settings.createDivider('Settings');
    settings.createString('baseUrl', "Base URL without '/' at the end", 'http://fs.life', function(v) {
        service.baseUrl = v;
    });

	////////////////////////////////////////////Login of site & Exit of site///////////////////////////////////////

	settings.createDivider('Авторизация на FS.LIFE');
	var store = plugin.createStore('authinfo', true);

	// Залогинится
	settings.createAction('createAuth', 'Войти на сайт', function login(){
		var credentials = plugin.getAuthCredentials(plugin.getDescriptor().synopsis,
		                                            'Пожалуйста введите свой логин и пароль от сайта', true);

		if (credentials.rejected) {
            showtime.notify('Для завершения авторизации вы должны ввести логин и пароль вашего аккаунта', 5, '');
            return;
        }
	    if (credentials.username && credentials.password) {
	        var doc = showtime.httpReq(service.baseUrl.toString() + "/login.aspx", {
			    headers: {"Accept": "application/json, text/javascript, */*; q=0.01",
                          "Accept-Language": "ru,en-US;q=0.7,en;q=0.3",
                          "Accept-Encoding": "gzip, deflate",
                          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                          "X-Requested-With": "XMLHttpRequest",
                          "Referer": "http://fs.life/",
                          "Connection": "keep-alive",
                          "Pragma": "no-cache",
                          "Cache-Control": "no-cache",},
                postdata: "login=" + credentials.username + "&passwd=" + credentials.password + "&remember=1",
			    noFail: true,
			    debug: true,
				noFollow: true
            });

			showtime.notify("Отсылаем запрос на авторизацию", 5, '');
			//if (doc.statuscode == 200){ //Available only from 4.99.211 version
			    if (doc.toString().match(/"state":"auth_success"/) || doc.toString().match(/isLogged : true/)) {
			        store.access_data = { username : credentials.username, password : credentials.password };
			        showtime.notify("Авторизация успешна", 5, '');
				} else if (doc.toString().match(/"state":"auth_error"/) || doc.toString().match(/isLogged : false/)){
					        showtime.notify("Авторизация не удачна, логин или пароль введены неверно.", 5, '');
							login();
						} else showtime.notify("Что то здесь не так нужно разобраться", 5, '');
			//} else {showtime.notify("Запрос на авторизацию не удачен, статус=" + doc.statuscode , 5, '');}
        } else {
	        showtime.notify('Для завершения авторизации вы должны ввести логин и пароль вашего аккаунта', 5, '');
            login();
		}
	});

	// Разлогинится
	settings.createAction('clearAuth', 'Выйти с сайта', function() {
	    var confirm = showtime.message("Вы уверены, что хотите разлогинится на сайте", true, true);
	    if (confirm){
	        store.access_data = {};
	   		var doc = showtime.httpReq(service.baseUrl.toString() + "/logout.aspx", {
	    	    headers: {"Accept": "application/json, text/javascript, */*; q=0.01",
                          "Accept-Language": "ru,en-US;q=0.7,en;q=0.3",
                          "Accept-Encoding": "gzip, deflate",
                          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                          "X-Requested-With": "XMLHttpRequest",
                          "Referer": "http://fs.life/",
                          "Connection": "keep-alive",
                          "Pragma": "no-cache",
                          "Cache-Control": "no-cache",},
                postdata: "",
	    	    noFail: true,
	    	    debug: true,
	    		noFollow: true
            });
            showtime.notify('Movian разлогинен на FS.LIFE', 3, '');
		}
    });

 /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = true;
    }

    // remove multiple, leading or trailing spaces and line feeds
    function trim(s) {
        if (s) return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/g,'');
        return '';
    }

    function removeSlashes(s) {
        return s.replace(/\\'/g, '\'').replace(/\\"/g, '"').replace(/\\0/g, '\0').replace(/\\\\/g, '\\');
    }

    function blueStr(str) {
        return '<font color="6699CC">' + str + '</font>';
    }

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45',  white = 'FFFFFF';

    function colorStr(str, color) {
        return '<font color="' + color + '">(' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function getFontColor(type) {
        switch (type) {
            case "Видео":
                return '"FFDE00"';
            case "Аудио":
                return '"FF0000"';
            case "Игры":
                return '"92CD00"';
            case "Литература":
                return '"6699CC"';
            default:
                return '"FFDE00"';
        }
    }

    function getType(type) {
        type = type.toLowerCase();
        switch (type) {
            case "mkv":
            case "avi":
            case "flv":
            case "mp4":
            case "mov":
            case "ts":
            case "mpg":
            case "mpeg":
            case "vob":
            case "iso":
            case "m4v":
            case "wmv":
            case "m2ts":
                return "video";
            case "jpg":
            case "jpeg":
            case "png":
            case "bmp":
            case "gif":
                return "image";
            case "mp3":
            case "flac":
            case "wav":
            case "ogg":
            case "aac":
            case "m4a":
            case "ape":
            case "dts":
            case "ac3":
            case "opus":
                return "audio";
            default:
                return "file";
        }
    }

    // Appends the item and lists it's root folder
    plugin.addURI(plugin.getDescriptor().id + ":screens:(.*):(.*)", function(page, screens, title) {
        setPageHeader(page, unescape(title));
        screens = unescape(screens);
        var re = /rel="([\S\s]*?)"/g;
        var m = re.exec(screens);
        var i = 0;
        while (m) {
            i++;
            page.appendItem("http:" + m[1], "image", {
                title: 'Скриншот' + i
            });
            m = re.exec(screens);
        };
        page.loading = false;
    });

    // Appends the item and lists it's root folder
    plugin.addURI(plugin.getDescriptor().id + ":listRoot:(.*):(.*)", function(page, url, title) {
        title = unescape(title).replace(/(<([^>]+)>)/ig).replace(/undefined/g,'');
        setPageHeader(page, title);
        var response = showtime.httpReq(service.baseUrl + url).toString();

		// Scrape iframe obj
	    var iframe_url = response.match(/<iframe src="([\S\s]*?)"/);
		if (iframe_url && iframe_url[1] != "about: blank") {
		    iframe_url = iframe_url[1];
		    var iframe_obj_response = showtime.httpReq(service.baseUrl + iframe_url, {
	    	    headers: {
                          "X-Requested-With": "XMLHttpRequest",
                         }
			});
			if (iframe_obj_response) var obj_resp = showtime.JSONDecode(iframe_obj_response);
		}

        // Scrape icon
	    var icon = response.match(/<link rel="image_src" href="([^"]+)"/);
	    //if (icon) icon = "http:" + icon[1];
        if (icon) icon = icon[1];

        // Scrape description
	    var description = response.match(/<p class="item-decription [^"]+">([\S\s]*?)<\/p>/);
	    if (description) description = coloredStr("Описание: ", orange) + description[1]; else description = '';

        // Scrape duration
        var duration = response.match(/itemprop="duration"[\S\s]*?>([\S\s]*?)<\/span>/);
        if (duration) duration = duration[1].trim().substr(0, 8);

        // Scrape item info
        var iteminfo = response.match(/<div class="item-info">([\S\s]*?)<\/div>/);

        if (iteminfo) {  //(This  old design)
           iteminfo = iteminfo.toString();
           // Scrape years
           var year = iteminfo.match(/Год:[\S\s]*?<span>([\S\s]*?)<\/span>/);
           if (year) {
              year = year[1];
           } else { // handle as serials
              year = iteminfo.match(/показа:[\S\s]*?<span>([\S\s]*?)<\/span>[\S\s]*?<span>([\S\s]*?)<\/span>/);
              if (year) year = year[1];
           };

           // Scrape genres
           var htmlBlock = iteminfo.match(/itemprop="genre"([\S\s]*?)<\/td>/);
           // Try to handle as shows
           if (!htmlBlock) htmlBlock = iteminfo.match(/Жанр:([\S\s]*?)<\/tr>/);
           if (htmlBlock) {
              var genres = '';
              var notFirst = 0;
              var re = /<span>([\S\s]*?)<\/span>/g;
              var m = re.exec(htmlBlock[1]);
              while (m) {
                    if (!notFirst) genres = genres + m[1]; else genres = genres + ", " + m[1];
                    notFirst++;
                    m = re.exec(htmlBlock[1]);
              };
           }; // Scrape genres

           // Try to get status
           htmlBlock = iteminfo.match(/Статус:[\S\s]*?<\/td>[\S\s]*?>([\S\s]*?)<\/td>/);
           if (htmlBlock)
              description = coloredStr("Статус: ", orange) + trim(htmlBlock[1]) + " " + description;

		} else if (obj_resp) { //(This new design)
		    // Scrape years
            if (obj_resp.coverData.year){
			    var year = obj_resp.coverData.year[0].title;
			} else if (obj_resp.coverData.view_period){ // handle as serials
			    year = obj_resp.coverData.view_period.show_start.title
			};
			// Scrape genres
			if (obj_resp.coverData.genre && obj_resp.coverData.genre.length > 0) {
			    var genres = "";
			    for (var i = 0; i < obj_resp.coverData.genre.length; i++){
				    if (i === 0) genres = obj_resp.coverData.genre[i].title;
					else genres = genres + ", " + obj_resp.coverData.genre[i].title;
				}
			}
			// Try to get status
			if (obj_resp.coverData.status) description = coloredStr("Статус: ", orange) + trim(obj_resp.coverData.status) + " " + description;
        }

        // Scrape votes
        htmlBlock = response.match(/<div class="b-tab-item__vote-value m-tab-item__vote-value_type_yes">([\S\s]*?)<\/div>[\S\s]*?<div class="b-tab-item__vote-value m-tab-item__vote-value_type_no">([\S\s]*?)<\/div>/);
        if (htmlBlock) {
            description = '(' + coloredStr(htmlBlock[1], green) + '/' + coloredStr(htmlBlock[2], red) + ') ' + description;
        } // Scrape votes

        // scrape original title
        htmlBlock = response.match(/itemprop="alternativeHeadline">([\S\s]*?)<\/div>/);
        if (htmlBlock) {  // old design
            title += ' | ' + htmlBlock[1];
            page.metadata.title += ' | ' + htmlBlock[1];
        } else if (obj_resp){ //new design data of "iframe"
			if (obj_resp.coverData.title_origin){
			    title += ' | ' + obj_resp.coverData.title_origin;
			}
		}

        playOnlineUrl = url;
        page.appendItem(plugin.getDescriptor().id + ":playOnline:" + escape(title), "video", {
            title: new showtime.RichText(title),
            duration: duration,
            icon: icon,
            year: +year,
            genre: genres,
            description: new showtime.RichText(description)
        });

        // Scrape trailer
        htmlBlock = response.match(/window\.location\.hostname \+ '([\S\s]*?)'/);
        if (htmlBlock) {
            page.appendItem(service.baseUrl + htmlBlock[1], "video", {
                title: 'Трейлер',
                icon: icon
            });
        } // Scrape trailer

        // Scrape screenshots
		///////////////////////////if new player on page... page include "iframe"///////////////////////////////
		if (obj_resp){
			if (obj_resp.coverData.screens && obj_resp.coverData.screens.length > 0){
			    var screen_str = "";
			    for (var i = 0; i < obj_resp.coverData.screens.length; i++){
				    screen_str = screen_str + "rel=\"" + obj_resp.coverData.screens[i].url1 + "\""; //for compatibility with the handler
				}
                page.appendItem(plugin.getDescriptor().id + ':screens:' + escape(screen_str)+':'+escape(title), "directory", {
                    title: 'Скриншоты'
				});
			}
		 ///////////////////////////////////if old player on page/////////////////////////////////////////
		} else {
		    htmlBlock = response.match(/<div class="items">([\S\s]*?)<\/div>/);
            if (htmlBlock) {
                if (trim(htmlBlock[1])) {
                    page.appendItem(plugin.getDescriptor().id + ':screens:' + escape(htmlBlock[1])+':'+escape(title), "directory", {
                        title: 'Скриншоты'
                    });
                }
            }
	    }
		// Scrape screenshots

        var what_else = response.match(/<div class="b-posters">([\S\s]*?)<div class="clear">/);

        // list files/folders
        page.loading = true;
        try {
            processAjax(page, url, 0, title);
        } catch(err) {
            showtime.trace(err);
        }

        if (iteminfo) {
            // Show year
            var year = iteminfo.match(/Год:[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?<span>([\S\s]*?)<\/span>/);
            if (year) {
                page.appendItem("", "separator", {
                    title: 'Год'
                });
                page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + year[1]) + ":" + escape(year[2]) + ':no:&sort=rating', "directory", {
                    title: year[2]
                });
            } else { // handle as serials
                year = iteminfo.match(/показа:[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?<span>([\S\s]*?)<\/span>[\S\s]*?<span>([\S\s]*?)<\/span>/);
                if (year && !year[2].match(/span/)) {
                    page.appendItem("", "separator", {
                        title: 'Год'
                    });
                    page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + year[1]) + ":" + escape(year[2]) + ':no:&sort=rating', "directory", {
                        title: year[2]
                    });
                }
            };

            // Scrape genres
            htmlBlock = iteminfo.match(/itemprop="genre"([\S\s]*?)<\/td>/);
            // Try to handle as shows
            if (!htmlBlock) htmlBlock = iteminfo.match(/Жанр:([\S\s]*?)<\/tr>/);
            if (htmlBlock) {
                page.appendItem("", "separator", {
                    title: 'Жанр'
                });
                var re = /<a href="([\S\s]*?)"[\S\s]*?<span>([\S\s]*?)<\/span>/g;
                var m = re.exec(htmlBlock[1]);
                while (m) {
                    page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + m[1]) + ":" + escape('Отбор по жанру: '+m[2]) + ':no:&sort=year', "directory", {
                        title: m[2]
                    });
                    m = re.exec(htmlBlock[1]);
                };
            }; // Scrape genres

            // Scrape countries
            var htmlBlock = iteminfo.match(/Страна:([\S\s]*?)<\/tr>/);
            if (htmlBlock) {
                page.appendItem("", "separator", {
                    title: 'Страна'
                });
                var re = /<a href="([\S\s]*?)"[\S\s]*?<\/span>([\S\s]*?)<\/span>/g;
                var m = re.exec(htmlBlock[1]);
                while (m) {
                    page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + m[1]) + ":" + escape('Отбор по стране: '+trim(showtime.entityDecode(m[2]))) + ':no:&sort=year', "directory", {
                        title: trim(showtime.entityDecode(m[2]))
                    });
                    m = re.exec(htmlBlock[1]);
                };
           }; // Scrape countries

            // Show directors
            htmlBlock = iteminfo.match(/itemprop="director"([\S\s]*?)<\/td>/);
            if (htmlBlock) {
                page.appendItem("", "separator", {
                    title: 'Режиссеры'
                });
                //1-link, 2-title
                var re = /<a href="([\S\s]*?)"[\S\s]*?<span itemprop="name">([\S\s]*?)<\/span>/g;
                var m = re.exec(htmlBlock[1]);
                while (m) {
                    page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + m[1]) + ":" + escape('Отбор по режиссеру: '+m[2]) + ':no:&sort=year', "directory", {
                        title: m[2]
                    });
                    m = re.exec(htmlBlock[1]);
                };
            };
            // Show actors
            htmlBlock = iteminfo.match(/itemprop="actor"([\S\s]*?)<\/td>/);
            if (htmlBlock) {
                page.appendItem("", "separator", {
                    title: 'Актеры'
                });
                //1-link, 2-title
                var re = /<a href="([\S\s]*?)"[\S\s]*?<span itemprop="name">([\S\s]*?)<\/span>/g;
                var m = re.exec(htmlBlock[1]);
                while (m) {
                    page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + m[1]) + ":" + escape('Отбор по актеру: '+m[2]) + ':no:&sort=year', "directory", {
                        title: m[2]
                    });
                    m = re.exec(htmlBlock[1]);
                };
            } else { // Try to handle as shows
                htmlBlock = iteminfo.match(/Ведущие:([\S\s]*?)<\/tr>/);
                if (htmlBlock) {
                    page.appendItem("", "separator", {
                        title: 'Ведущие'
                    });
                    //1-link, 2-title
                    var re = /<a href="([\S\s]*?)"[\S\s]*?<span>([\S\s]*?)<\/span>/g;
                    var m = re.exec(htmlBlock[1]);
                    while (m) {
                        page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + m[1]) + ":" + escape('Отбор по ведущему: '+m[2]) + ':no:&sort=year', "directory", {
                            title: m[2]
                        });
                        m = re.exec(htmlBlock[1]);
                    };
                }
            }; // handle as shows
        } else if(obj_resp) {
		    // Show year
            if (obj_resp.coverData.year){
                page.appendItem("", "separator", {
                    title: 'Год'
                });
                page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + obj_resp.coverData.year[0].link) + ":" + escape(obj_resp.coverData.year[0].title) + ':no:&sort=rating', "directory", {
                    title: obj_resp.coverData.year[0].title
                });
            } else if (obj_resp.coverData.view_period){  // handle as serials
                    page.appendItem("", "separator", {
                        title: 'Год'
                    });
                    page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + obj_resp.coverData.view_period.show_start.link) + ":" + escape(obj_resp.coverData.view_period.show_start.title) + ':no:&sort=rating', "directory", {
                        title: obj_resp.coverData.view_period.show_start.title
                    });
            }

		    // Scrape genres
            if (obj_resp.coverData.genre && obj_resp.coverData.genre.length > 0) {
                page.appendItem("", "separator", {
                    title: 'Жанр'
                });
				for (var i = 0; i < obj_resp.coverData.genre.length; i++){
                    page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + obj_resp.coverData.genre[i].link) + ":" + escape('Отбор по жанру: '+ obj_resp.coverData.genre[i].title) + ':no:&sort=year', "directory", {
                        title: obj_resp.coverData.genre[i].title
                    });
				}
            }; // Scrape genres

			// Scrape countries
            if (obj_resp.coverData.made_in && obj_resp.coverData.made_in.length > 0) {
                page.appendItem("", "separator", {
                    title: 'Страна'
                });
				for (var i = 0; i < obj_resp.coverData.made_in.length; i++){
                    page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + obj_resp.coverData.made_in[i].link) + ":" + escape('Отбор по стране: '+ obj_resp.coverData.made_in[i].title) + ':no:&sort=year', "directory", {
                        title: obj_resp.coverData.made_in[i].title
                    });
				}
            }; // Scrape countries

	        // Show directors
			if (obj_resp.coverData.director && obj_resp.coverData.director.length > 0) {
                page.appendItem("", "separator", {
                    title: 'Режиссеры'
                });
				for (var i = 0; i < obj_resp.coverData.director.length; i++){
                    page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + obj_resp.coverData.director[i].link) + ":" + escape('Отбор по режисерам: '+ obj_resp.coverData.director[i].title) + ':no:&sort=year', "directory", {
                        title: obj_resp.coverData.director[i].title
                    });
				}
            };// Show directors

	        // Show actors
			if (obj_resp.coverData.cast && obj_resp.coverData.cast.length > 0) {
                page.appendItem("", "separator", {
                    title: 'Актёры'
                });
				for (var i = 0; i < obj_resp.coverData.cast.length; i++){
                    page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + obj_resp.coverData.cast[i].link) + ":" + escape('Отбор по актёрам: '+ obj_resp.coverData.cast[i].title) + ':no:&sort=year', "directory", {
                        title: obj_resp.coverData.cast[i].title
                    });
				}
            };// Show actors
		};

        // Show related
        if (what_else) {
            what_else = what_else[1];
            page.appendItem("", "separator", {
                title: 'Похожие материалы'
            });
            // 1 - link, 2 - image, 3 - title
            re = /<a href="([^"]+)[\S\s]*?url\('([^']+)[\S\s]*?<span class="m-poster-new__full_title">([\S\s]*?)<\/span>/g;
            m = re.exec(what_else);
            while (m) {
                title = m[3].replace('<p>', " / ").replace('</p><p>', " ").replace('</p>', "");
                page.appendItem(plugin.getDescriptor().id + ":listRoot:" + m[1] + ":" + escape(title), "video", {
                    title: new showtime.RichText(title),
                    icon: setIconSize(m[2], 2)
                });
                m = re.exec(what_else);
            }
        }

        // Show comments
        var commented = response.match(/linkreview: '\/review\/(.*)'/);
        if (commented) {
            var tryToSearch = true, id = commented[1], counter = 0;;

            function loader() {
                if (!tryToSearch) return false;
                commented = showtime.httpReq(service.baseUrl + '/review/list/' + id + '?loadedcount=' + counter).toString();
                if (!counter)
                    var count = commented.match(/<p class="b-item-material-comments__count">([\S\s]*?)<\/p>/);
                    if (!count)
                        return tryToSearch = false;
                    page.appendItem("", "separator", {
                        title: count[1].replace('<span itemprop="reviewCount">', '').replace('</span>', '').replace('  ', ' ')
                    });

                // 1-icon, 2-nick, 3-datetime, 4-positive, 5-negative, 6-description
                re = /url\('([\S\s]*?)'\);[\S\s]*?<span itemprop="reviewer">([\S\s]*?)<\/span>[\S\s]*?datetime="[\S\s]*?">([\S\s]*?)<\/time>[\S\s]*?<span class="b-item-material-comments__item-answer-value">([\S\s]*?)<\/span>[\S\s]*?<span class="b-item-material-comments__item-answer-value">([\S\s]*?)<\/span>[\S\s]*?itemprop="description">([\S\s]*?)<\/div>/g;
                var match = re.exec(commented);
                while (match) {
                    page.appendPassiveItem('video', '', {
                        title: new showtime.RichText(trim(match[2]) + ' (' + coloredStr(match[4], green) + ' / ' + coloredStr(match[5], red) + ') ' + trim(match[3])),
                        icon: setIconSize(match[1], 1),
                        description: new showtime.RichText(match[6])
                    });
                    match = re.exec(commented);
                    counter++;
                }
                if (commented.match(/data-count="end"/)) return tryToSearch = false;
                return true;
            }
            loader();
            page.paginator = loader;
        }
        page.loading = false;
    });

    function getId(id) {
        if (id.indexOf(',') > -1)
            id = id.substr(0, id.indexOf(','));
        return id.replace(/\'/g, '');
    }

    function getQualities(blob) {
        // 1-filter value, 2-visual name
        var re = /name="([\s\S]*?)">([\s\S]*?)<\/a>/g;
        var match = re.exec(blob);
        var first = true;
        var out = [];
        while (match) {
            var item = {
                filter: match[1],
                name: match[2]
            };
            out.push(item)
            match = re.exec(blob);
        }
        if (!out.length)
            out.push({
                filter: '0',
                name: ''
            });
        return out;
    }

    function processAjax(page, url, folder, title, quality) {
        page.loading = true;

        //showtime.print(service.baseUrl + unescape(url) + '?ajax&blocked=0&folder=' + folder);

        var response = showtime.httpReq(service.baseUrl + unescape(url) + '?ajax&blocked=0&folder=' + folder).toString();
        response = response.substr(response.indexOf('class="filelist'), response.lastIndexOf('</ul>'));
        response = response.replace(/<ul class="filelist([\s\S]*?)<\/ul>/g, '');

        // 1-type(folder/file), 2-body
        var re = /<li class="([^"]+)([\S\s]*?)(<\/li>|"  >)/g;
        var m = re.exec(response);
        folderList = [];
        var pos = 0;
        while (m) {
            if (m[1].indexOf("file") > -1) {
                if (quality != '0'  && m[1].match(/b-file-new m-file-new_type_video (.*)\s/)[1] != quality) {
                    m = re.exec(response);
                    continue;
                }
                var flv_link = "";
                if (m[2].match(/a href="([^"]+)/))
                    flv_link = m[2].match(/a href="([^"]+)/)[1];
                var name = m[2].match(/span class="[\S\s]*?filename-text".?>([\S\s]*?)<\/span>/)[1];
                var size = m[2].match(/span class="[\S\s]*?material-size">([\S\s]*?)<\/span>/)[1];
                var direct_link = m[2].match(/" href="([^"]+)/)[1];
                if (getType(direct_link.split('.').pop()) == 'video') {
                    folderList.push({
                        title: page.metadata.title,
                        flvlink: flv_link,
                        directlink: direct_link
                    });
                    page.appendItem(plugin.getDescriptor().id + ":play:" + escape(name) + ':' + pos, 'video', {
                        title: new showtime.RichText(name + ' ' + colorStr(size, blue)),
						icon: "data:image/png;base64,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"
                    });
                    pos++;
                } else {
                    page.appendItem(service.baseUrl + direct_link, getType(direct_link.split('.').pop()), {
                        title: new showtime.RichText(name + ' ' + colorStr(size, blue))
                    });
                }
            } else {
                if (m[1].indexOf("folder") > -1 && m[2].indexOf("m-current") == -1) {
                    // 1-folder mark, 2-lang/type, 3-folderID, 4-title, 5-qualities, 6-details, 7-size, 8-date
                    var n = m[2].match(/class="b-folder-mark([\S\s]*?)"[\S\s]*?class="link-([\S\s]*?)title" rel="\{parent_id: (.*)\}"[\S\s]*?>([\S\s]*?)<\/a>([\S\s]*?)<\/div>[\S\s]*?<span class="material-[\S\s]*?">([\S\s]*?)<\/span>[\S\s]*?<span class="material-[\S\s]*?">([\S\s]*?)<\/span>[\S\s]*?<span class="material-[\S\s]*?">([^\<]+)<\/span>/);
                    if (n) {
                        var mark = n[1].replace(' m-', '');
                        var qualities = getQualities(n[5]);
                        for (var i in qualities) {
                            page.appendItem(plugin.getDescriptor().id + ":listFolder:" + escape(url) + ":" + escape(getId(n[3])) + ":" + escape(unescape(title)) + ':' + qualities[i].filter, "directory", {
                                title: new showtime.RichText((mark ? coloredStr(mark, orange) + ' ' : '') +
                                    coloredStr(n[2].replace('simple ', '').replace('subtype ', '').replace('m-', ''), orange) +
                                    trim(n[4]) + ' ' +
                                    (qualities[i].name ? coloredStr(qualities[i].name, blue) + ' ' : '') +
                                    colorStr(n[6], orange) + ' ' +
                                    colorStr(n[7], blue) + ' ' +
                                    n[8])
                            });
                        }
                    } else {
                        // 1-lang/type, 2-folderID, 3-title, 4-details, 5-size, 6-date
                        n = m[2].replace('<span class="material-size"></span>', '').match(/link-([\S\s]*?)title" rel="\{parent_id: (.*)\}"[\S\s]*?>([\S\s]*?)<\/a>[\S\s]*?<span class="material-[\S\s]*?">([\S\s]*?)<\/span>[\S\s]*?<span class="material-details">([^\<]+)[\S\s]*?<span class="material-date">([^\<]+)<\/span>/);
                        var lang = n[1].replace('simple ', '').replace('subtype ', '').replace('m-', '');
                        page.appendItem(plugin.getDescriptor().id + ":listFolder:" + escape(url) + ":" + escape(getId(n[2])) + ":" + escape(unescape(title)) + ':0', "directory", {
                            title: new showtime.RichText((lang ? coloredStr(lang, orange) + ' ' : '') +
                                trim(n[3]) + ' ' +
                                colorStr(n[4], orange) + ' ' +
                                colorStr(n[5], blue) + ' ' +
                                n[6])
                        });
                    }
                }
            }
            m = re.exec(response);
        }
        page.loading = false;
    }

    plugin.addURI(plugin.getDescriptor().id + ":listFolder:(.*):(.*):(.*):(.*)", function(page, url, folder, title, quality) {
        setPageHeader(page, unescape(title));
        processAjax(page, url, folder, title, quality);
    });

    // Search IMDB ID by title
    function getIMDBid(title) {
        var imdbid = null;
        var title = showtime.entityDecode(unescape(title)).toString();
        showtime.print('Splitting the title for IMDB ID request: ' + title);
        var splittedTitle = title.split('|');
        if (splittedTitle.length == 1)
            splittedTitle = title.split('/');
        if (splittedTitle.length == 1)
            splittedTitle = title.split('-');
        showtime.print('Splitted title is: ' + splittedTitle);
        if (splittedTitle[1]) { // first we look by original title
            var cleanTitle = splittedTitle[1].trim();
            var match = cleanTitle.match(/[^\(|\[|\.]*/);
            if (match)
                cleanTitle = match;
            showtime.print('Trying to get IMDB ID for: ' + cleanTitle);
            resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(cleanTitle)).toString();
            imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
            if (!imdbid && cleanTitle.indexOf('/') != -1) {
                splittedTitle2 = cleanTitle.split('/');
                for (var i in splittedTitle2) {
                    showtime.print('Trying to get IMDB ID for: ' + splittedTitle2[i].trim());
                    resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(splittedTitle2[i].trim())).toString();
                    imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
                    if (imdbid) break;
                }
            }
        }
        if (!imdbid)
            for (var i in splittedTitle) {
                if (i == 1) continue; // we already checked that
                var cleanTitle = splittedTitle[i].trim();
                var match = cleanTitle.match(/[^\(|\[|\.]*/);
                if (match)
                    cleanTitle = match;
                showtime.print('Trying to get IMDB ID for: ' + cleanTitle);
                resp = showtime.httpReq('http://www.imdb.com/find?ref_=nv_sr_fn&q=' + encodeURIComponent(cleanTitle)).toString();
                imdbid = resp.match(/<a href="\/title\/(tt\d+)\//);
                if (imdbid) break;
            }

        if (imdbid) {
            showtime.print('Got following IMDB ID: ' + imdbid[1]);
            return imdbid[1];
        }
        showtime.print('Cannot get IMDB ID :(');
        return imdbid;
    };

	// Processes "Play online" button
    var playOnlineUrl;
    plugin.addURI(plugin.getDescriptor().id + ":playOnline:(.*)", function(page, title) {
        page.loading = true;
        var response = showtime.httpReq(service.baseUrl + playOnlineUrl).toString();
        page.loading = false;

		var iframe_url = response.match(/<iframe src="([\S\s]*?)"/);

		if (iframe_url && iframe_url[1] != "about: blank") {
		    iframe_url = iframe_url[1];
		    var iframe_obj_response = showtime.httpReq(service.baseUrl + iframe_url, {
	    	    headers: {
                          "X-Requested-With": "XMLHttpRequest",
                         }
			});
			if (iframe_obj_response) var obj_resp = showtime.JSONDecode(iframe_obj_response);


		    if (obj_resp.actionsData.rootQualityFlag == 'hd'){
			    var link = obj_resp.actionsData.files[0].url.replace(".mp4", "_hd.mp4");
			} else link = obj_resp.actionsData.files[0].url;

		} else {

            var url = response.match(/playlist: \[[\S\s]*?url: '([^']+)/) // Some clips autoplay

            if (!url) {
                page.loading = true;

                var view_online_batton_url = service.baseUrl + response.match(/<div id="page-item-viewonline"[\S\s]*?<a href="([^"]+)/)[1];
                var link_id = view_online_batton_url.match(/\/i(?:[a-zA-Z0-9]{4}\.)?([0-9a-zA-Z]+)/i)[1];
                var frame_hash_JSON_link = service.baseUrl + "/jsitem/i" + link_id + "/status.js?hr=" + escape(service.baseUrl + playOnlineUrl) + "&rf=";


                var frame_hash_JSON = showtime.httpReq(frame_hash_JSON_link).toString();
                var frame_hash = frame_hash_JSON.match(/frame_hash\': \'([\S\s]*?)\'/)[1];

                var response = showtime.httpReq(
                        view_online_batton_url.replace('view', 'view_iframe') + "?frame_hash=" + frame_hash, {
                            headers: {
                                      "X-Requested-With": "XMLHttpRequest",
                                     }
                        }).toString();

                page.loading = false;

                var link = showtime.JSONDecode(response).actionsData.files[0].url;

               /* showtime.print("response-1");
                //showtime.print(response);
                page.loading = false;
                response = response.match(/<a id="[\S\s]*?" href="([\S\s]*?)" title="([\S\s]*?)"/);
                if (!response) {
                    page.error("Линк на проигрывание отсутствует :(");
                    return;
                }
                page.loading = true;
                url = showtime.httpReq(service.baseUrl + response[1]).toString().match(/playlist: \[[\S\s]*?url: '([^']+)/);
                page.loading = false;*/
            } else {
                var link = url[1];
            }
        }

        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            imdbid: getIMDBid(title),
            canonicalUrl: plugin.getDescriptor().id + ":playOnline:" + title,
            sources: [{
                url: service.baseUrl + link
            }]
        });
    });

	// Play URL
    plugin.addURI(plugin.getDescriptor().id + ":play:(.*):(.*)", function(page, title, pos) {
        page.type = "video";
        page.loading = true;
        if (showtime.probe(service.baseUrl + folderList[pos].directlink).result == 0) {
            var season = null, episode = null;
            var name = unescape(title).toUpperCase();
            var series = name.match(/S(\d{1,2})E(\d{3})/); // SxExxx, SxxExxx
            if (!series) series = name.match(/S(\d{1,2})E(\d{2})/); // SxExx, SxxExx
            if (series) {
                season = +series[1];
                episode = +series[2];
                showtime.print('Season: ' + season + ' Episode: ' + episode);
            }
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ":play:" + title + ':' + pos,
                imdbid: getIMDBid(folderList[pos].title),
                season: season,
                episode: episode,
                sources: [{
                    url: service.baseUrl + folderList[pos].directlink
                }],
                no_fs_scan: true
            });
            page.loading = false;
            return;
        }
        page.loading = true;
        var response = showtime.httpReq(service.baseUrl + folderList[pos].flvlink).toString();
        page.loading = false;
        title = response.match(/<title>([\S\s]*?)<\/title>/)[1];
        var blob = response.match(/class="b-view-material"([\S\s]*?)<\/div>/);
        if (blob)
            var link = blob[1].match(/<a href="([^"]+)/)[1];
        if (!link)
            var m = response.match(/playlist: \[[\S\s]*?url: '([^']+)/);
        else {
            page.loading = true;
            var m = showtime.httpReq(service.baseUrl + folderList[pos].flvlink).toString().match(/playlist: \[[\S\s]*?url: '([^']+)/);
            page.loading = false;
        }
        if (!m) { // first file from the first folder
            page.loading = true;
            m = showtime.httpReq(service.baseUrl + folderList[pos].flvlink + '?ajax&blocked=0&folder=0').toString().match(/class="filelist m-current"[\S\s]*?" href="([^"]+)/);
            page.loading = false;
        }
        if (m) {
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ":play:" + title + ':' + pos,
                imdbid: getIMDBid(folderList[pos].title),
                sources: [{
                    url: service.baseUrl + m[1]
                }]
            });
        } else page.error("Линк не проигрывается :(");
    });

    // Index page
    plugin.addURI(plugin.getDescriptor().id + ":index:(.*):(.*):(.*):(.*)", function(page, url, title, populars, param) {
        if (param == 'noparam') param = ''; // workaround for ps3 regex quirks
        setPageHeader(page, unescape(title));
        try {
             var doc = showtime.httpReq(url.substr(0,4) == 'http' ? unescape(url) + '?view=detailed'+param : service.baseUrl + unescape(url) + '?view=detailed'+param).toString();
        } catch (err) {}

        if (doc) {
             if (populars == 'yes') {
                var match = doc.match(/<div id="adsProxy-zone-section-glowadswide"><\/div>([\S\s]*?)<div class="b-clear">/);
                if (match) {
                    showPopulars(page, match[1], 'Самое просматриваемое сейчас');
    	            page.appendItem("", "separator", {
                        title: ''
                    });
                }
             }

            function loader() {
                response = doc.match(/<div class="b-section-list([\S\s]*?)<script type="text\/javascript">/)[1];
                indexer(page);
                var nextPage = doc.match(/<a class="next-link"href="([\S\s]*?)">/);
                if (nextPage) {
                    page.loading = true;
                    doc = showtime.httpReq(nextPage[1].substr(0, 4) == 'http' ? nextPage[1] : service.baseUrl + nextPage[1]).toString();
                    page.loading = false;
                    return true;
                }
                return false;
            }
            loader();
            page.paginator = loader;
        };
        page.loading = false;
    });

    // Top 9
    function showPopulars(page, match, title) {
        page.appendItem("", "separator", {
            title: title
        });

        // 1-link, 2-logo, 3-title
        var re = /<div class="b-poster-[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?url\('([\S\s]*?)'\)[\S\s]*?<span class=".-poster-[\S\s]*?title">([\S\s]*?)<\/span>/g;
        var m = re.exec(match);
        while (m) {
            page.appendItem(plugin.getDescriptor().id + ":listRoot:" + m[1] + ":" + escape(trim(m[3])), "video", {
                title: new showtime.RichText(trim(m[3]).replace(/(<([^>]+)>)/ig, "")),
                icon: setIconSize(m[2], 2)
            });
            m = re.exec(match);
        }
    }

    // shows last commented
    var comments;
    plugin.addURI(plugin.getDescriptor().id + ":comments", function(page) {
        setPageHeader(page, 'Обcуждаемые материалы');
        //1-link, 2-title, 3-icon, 4-type, 5-year, 6-country, 7-genres list,
        //8-directors, 9-actors, 10-positive/negative, 11-rating, 12-text, 13-nick,
        //14-positive/negative, 15-rating, 16-text, 17-nick
        var re = /<a href="([\S\s]*?)"[\S\s]*?<span class="b-main__top-commentable-item-title-value">([\S\s]*?)<\/span>[\S\s]*?url\(([\S\s]*?)\);[\S\s]*?<span class="b-main__top-commentable-item-subsection">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-year-country">([\S\s]*?)<span class="b-main__new-item-attributes-delimiter"><\/span>([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-genre">([\S\s]*?)<span class="b-main__top-commentable-item-director">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-cast">([\S\s]*?)<\/span>[\S\s]*?class="b-main__top-commentable-item-comment m-main__top-commentable-item-comment_bg_([\S\s]*?)">[\S\s]*?<span class="b-main__top-commentable-item-comment-content-rating">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-comment-content-text">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-comment-content-name m-main__top-commentable-item-comment-content-name_">([\S\s]*?)<\/span>[\S\s]*?class="b-main__top-commentable-item-comment m-main__top-commentable-item-comment_bg_([\S\s]*?)">[\S\s]*?<span class="b-main__top-commentable-item-comment-content-rating">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-comment-content-text">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__top-commentable-item-comment-content-name m-main__top-commentable-item-comment-content-name_">([\S\s]*?)<\/span>/g;
        var match = re.exec(comments);
        while (match) {
            page.appendItem(plugin.getDescriptor().id + ":listRoot:" + match[1]+ ':' + escape(trim(match[2])), 'video', {
                title: trim(match[2]),
                icon: setIconSize(match[3], 2),
                year: +(trim(match[5].replace(/\D+/, '')).substr(0,4)),
                genre: new showtime.RichText(match[4] + ' ' + colorStr(trim(match[7].replace(/<[^>]*>/g, '')), orange)),
                description: new showtime.RichText(colorStr(trim(match[11]), match[10] == "negative" ? red : green) + ' '+
                    coloredStr(match[13], orange) + ': ' + match[12] + ' '+
                    '<br>' + colorStr(trim(match[15]), match[14] == "negative" ? red : green) + ' '+
                    coloredStr(match[17], orange) + ': ' + match[16])
            });
            match = re.exec(comments);
        }
        page.loading = false;
    });

    var response;
    function indexer(page) {
        page.loading = true;
        // 1-link, 2-icon, 3-title, 4-qualities(for films),
        // 5-votes+, 6-votes-, 7-year/country, 8-genre/actors, 9-description
        var re = /<a class="b-poster-detail__link" href="([\S\s]*?)">[\S\s]*?<img src="([\S\s]*?)" alt='([\S\s]*?)' width=([\S\s]*?)<span class="b-poster-detail__vote-positive">([\S\s]*?)<\/span>[\S\s]*?<span class="b-poster-detail__vote-negative">([\S\s]*?)<\/span>[\S\s]*?<span class="b-poster-detail__field">([\S\s]*?)<\/span>[\S\s]*?<span class="b-poster-detail__field">([\S\s]*?)<\/span>[\S\s]*?<span class="b-poster-detail__description">([\S\s]*?)<\/span>/g;
        var match = re.exec(response);
        while (match) {
            // parsing quality list
            var quality = '';
            var re2 = /<span class="quality m-([\S\s]*?)">/m;
            var match2 = re2.exec(match[4]);
            if (match2)
                quality = match2[1].toUpperCase();
            var genre = '', actors = '';
            if (quality) {
                quality = coloredStr(quality, blue) + ' ';
                actors = coloredStr('Актеры: ', orange) + match[8] + ' ';
            } else {
                genre = match[8];
            }
            page.appendItem(plugin.getDescriptor().id + ":listRoot:" + escape(match[1]) + ":" + escape(match[3].replace(/\\\'/g, "'").replace(/\\\"/g, '"')), "video", {
                title: new showtime.RichText(quality + match[3].replace(/\\\'/g, "'").replace(/\\\"/g, '"')),
                icon: setIconSize(match[2], 2),
                genre: genre,
                year: +match[7].substr(0,4),
                description: new showtime.RichText('('+coloredStr(match[5], green)+'/'+coloredStr(match[6], red) + ') ' + actors + coloredStr("Производство: ", orange) + ' ' +
                    trim(match[7].split('●')[1]) + ' ' + (match[9] ? coloredStr("<br>Описание: ", orange) + trim(match[9]) : ''))
            });
            match = re.exec(response);
        }
        page.loading = false;
    }

    function processScroller(page, url) {
        page.loading = true;
        try {
            var doc = showtime.httpReq(service.baseUrl + url).toString();
        } catch (err) {}

        if (doc) {
            var match = doc.match(/<div class="b-nowviewed">([\S\s]*?)<div class="b-clear">/);
            if (match)
                showPopulars(page, match[1], 'Самое просматриваемое сейчас');
            else { // try like series
                var match = doc.match(/<div id="adsProxy-zone-section-glowadswide">([\S\s]*?)<div class="b-clear">/);
                if (match)
                    showPopulars(page, match[1], 'Популярно сейчас');
            }

            //show populars
            var tryToSearch = true, counter = 0;
            function loader() {
                if (!tryToSearch) return false;
                response = doc.match(/<div class="b-section-list([\S\s]*?)<script type="text\/javascript">/);
                if (response) {
                    response = response[1];
                    if (!counter)
                        page.appendItem("", "separator", {
                            title: 'Популярные материалы'
                        });
                    indexer(page);
                    counter++;
                }
                var next = response.match(/<a class="next-link"href="([\S\s]*?)">/);
                if (!next) return tryToSearch = false;
                page.loading = true;
                doc = showtime.httpReq(service.baseUrl + next[1]).toString();
                page.loading = false;
                return true;
            }
            loader();
            page.paginator = loader;
        }
        page.loading = false;
    }

    // lists submenu
    plugin.addURI(plugin.getDescriptor().id + ":submenu:(.*):(.*):(.*)", function(page, url, title, menu) {
        setPageHeader(page, unescape(title));
        menu = unescape(menu);
        //1-url, 2-title
        var re = /<a class="b-header__menu-subsections-item" href="([\S\s]*?)">[\S\s]*?<span class="b-header__menu-subsections-item-title m-header__menu-subsections-item-title_type_[\S\s]*?">([\S\s]*?)<\/span>/g;
        var match = re.exec(menu);
        while (match) {
            page.appendItem(plugin.getDescriptor().id + ":index:" + escape(service.baseUrl + match[1]) + ':' + trim(match[2]) + ':yes:noparam', 'directory', {
                title: trim(match[2])
            });
            match = re.exec(menu);
        }
        processScroller(page, url);
    });


	/////////////////////////////////////////////////// Lists favorite menu///////////////////////////////////////////////////

	plugin.addURI(plugin.getDescriptor().id + ":myfavourites", function(page) {
        setPageHeader(page, "В избранном на FS.life");
		response = showtime.httpReq(service.baseUrl + "/myfavourites.aspx").toString().replace(/<div class="b-header__menu-section m-header__menu-section_type_fsua">/g, '');

        // Building favorite menu
		var menu = response.match(/<div class="b-tabs-decorated">[\S\s]*?<ul>[\S\s]*?(<li[\S\s]*<\/li>)[\S\s]*?<\/ul>[\S\s]*?<\/div>/)[1]; //находим блок меню

		//1-url, 2-title
		var re = /<li[\S\s]*?<a href="([\S\s]*?)">([\S\s]*?)<\/a><\/li>/g;
		var match = re.exec(menu);
		while (match) {
            page.appendItem(plugin.getDescriptor().id + ":myfavourites_menu:" + match[1]+ ':' + escape(trim(match[2].replace(/&nbsp;/, " "))), 'directory', {
                title: trim(match[2].replace(/&nbsp;/, " "))
            });
            match = re.exec(menu);
        }
        page.loading = false;
    });

	plugin.addURI(plugin.getDescriptor().id + ":myfavourites_menu:(.*):(.*)", function(page, url, title) {
	    setPageHeader(page, unescape(title));
		response = showtime.httpReq(service.baseUrl + url).toString().replace(/<div class="b-header__menu-section m-header__menu-section_type_fsua">/g, '');

		//0-subsection, 1-title, 2-section, 3-subsection
		var re = /<span class="section-title"><b>([\S\s]*?)<\/b>[\S\s]*?<div class="b-section-footer">[\S\s]*?<a href="#" class="b-add" rel="\{section: '([\S\s]*?)', subsection: '([\S\s]*?)'\}[\S\s]*?<\/div>[\S\s]*?<\/div>/g;
		var match = re.exec(response);
		while (match) {
		    page.appendItem(plugin.getDescriptor().id + ":myfavourites_content:" + url + ':' + escape(trim(match[1])) + ':' + match[2] + ':' +  match[3], 'directory', {
                title: trim(match[1])
            });
		    match = re.exec(response);
		}
		page.loading = false;
	});

	plugin.addURI(plugin.getDescriptor().id + ":myfavourites_content:(.*):(.*):(.*):(.*)", function(page, url, title, section, subsection) {
	    setPageHeader(page, unescape(title));

		//1-url, 2- poster 3-title
	    var re = /<a href="(\/\/fs\.life)?([\S\s]*?)" class="b-poster-thin[\S\s]*?style="background-image: url\('([\S\s]*?)'\)"[\S\s]*?<b class=[\S\s]*?<span>([\S\s]*?)<\/p><\/span><\/b>[\S\s]*?<\/a>/g ;
		var curpage, dig_curpage = 0;
		do{
			if (!dig_curpage) {
			    curpage = "";
			} else {
			    curpage = dig_curpage;
			}
		    var ajax = url.split("?")[0] + "?" + "ajax&" + url.split("?")[1] + "&section=" + section + "&subsection=" + subsection + "&action=get_list&rows=1&curpage=" + curpage;
			response = showtime.httpReq(service.baseUrl + ajax).toString();
			var obj_response = showtime.JSONDecode(response);
			match = re.exec(obj_response.content);
			while (match) {
                title = match[4].replace('<p>', " / ").replace('</p><p>', " ").replace('</p>', "");
                page.appendItem(plugin.getDescriptor().id +":listRoot:" + match[2]+ ':' + escape(trim(match[4])), 'video', {
                    title: new showtime.RichText(title),
                    icon: setIconSize(match[3], 2)
                });
			 match = re.exec(obj_response.content);
            }
			dig_curpage++ ;
        } while (!obj_response.islast);

		 page.loading = false;

	});

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function setIconSize(s, size) {
	    s = "http:" + s; //Fixed posters
        result = s;
        var lastMatch = s.lastIndexOf('/');
        if (lastMatch != -1)
            result = s.substr(0, s.substr(0, lastMatch - 1).lastIndexOf('/') + 1) + size + s.substr(lastMatch);
        return result;
    }

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        response = showtime.httpReq(service.baseUrl).toString().replace(/<div class="b-header__menu-section m-header__menu-section_type_fsua">/g, '');

        // Building menu
        if (response.match(/<link rel="canonical" href="http:\/\/cxz.to/)) { // cxz.to
            //1-link, 2-title
            var re = /<div class="b-header__menu-section[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?">([\S\s]*?)<\/a>/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ":index:" + match[1]+ ':' + escape(trim(match[2])) + ':no:noparam', 'directory', {
                    title: trim(match[2])
                });
                match = re.exec(response);
            }
        } else {
            //1-link, 2-title, 3-submenus
            var re = /<div class="b-header__menu-section[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?">([\S\s]*?)<\/a>([\S\s]*?)<div class="b-clear">/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ":submenu:" + match[1]+ ':' + escape(trim(match[2])) + ':' + escape(match[3]), 'directory', {
                    title: trim(match[2])
                });
                match = re.exec(response);
            }
        }

		//////////////////////////////////////////////If login, add my favorites///////////////////////////////////

		if (response.match(/b-header__user-icon b-header__user-favourites/)){
		    page.appendItem(plugin.getDescriptor().id + ":myfavourites", 'directory', {
                    title: "В избранном на FS.Life"
                });
		}

		//////////////////////////////////////////////////////////////////////////////////////////////////////////

        // Scraping commentable
        comments = response.match(/<div class="b-main__top-commentable-inner">([\S\s]*?)<div class="b-clear">/);
        if (comments) {
            comments = comments[1];
            page.appendItem(plugin.getDescriptor().id + ':comments', "directory", {
                title: 'Обcуждаемые материалы'
            });
        }

        // Show most popular
        match = response.match(/__posters([\S\s]*?)<div class="b-clear">/);
        if (match)
            showPopulars(page, match[1], 'Самые популярные материалы');

        // Front page scraper
        var doc = response.match(/<div class="b-main__new-title">([\S\s]*?)#content-->/);
        if (doc) {
            page.appendItem("", "separator", {
                title: 'Новое на сайте'
            });

            //1-link, 2-icon, 3-type, 4-title, 5-genre, 6-produced, 7-description,
            //8-author, 9-time
            var re = /<a href="([\S\s]*?)"[\S\s]*?url\('([\S\s]*?)'\);[\S\s]*?<span class="b-main__new-item-subsection">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__new-item-title m-main__new-item-title_theme_[\S\s]*?">([\S\s]*?)<\/span>[\S\s]*?<span>([\S\s]*?)<\/span>[\S\s]*?<\/span>([\S\s]*?)<\/span>([\S\s]*?)<span class="b-main__new-item-add-info-auth">([\S\s]*?)<\/span>[\S\s]*?<span class="b-main__new-item-add-info-time">([\S\s]*?)<\/span>/g;

            var match = re.exec(doc[1]);
            while (match) {
                var description = trim(match[7].replace(/<[^>]*>/g, '').replace('.......',''))
                page.appendItem(plugin.getDescriptor().id + ":listRoot:" + escape(match[1]) + ":" + escape(showtime.entityDecode(match[4])), "video", {
                    title: new showtime.RichText(match[4]),
                    icon: setIconSize(match[2], 2),
                    genre: new showtime.RichText(match[3] + ' ' + (trim(match[5].replace(/<[^>]*>/g, '')) ? colorStr(trim(match[5]), orange) : '')),
                    description: new showtime.RichText((trim(match[6]) ? coloredStr('Произведено: ',orange) + trim(match[6]) + ' ' : '') +
                       coloredStr('Добавил: ',orange) + match[8] + ' ' + colorStr(match[9], blue) +
                       (description ? coloredStr(' Описание: ',orange) + description : ''))
                });
                match = re.exec(doc[1]);
            }
        } else {
            page.appendItem("", "separator", {
               title: 'Популярные материалы'
            });
            indexer(page);
        }
        page.loading = false;
    });

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
	page.entries = 0;
	var fromPage = 0, tryToSearch = true;

	// 1-link, 2-icon, 3-title, 4-subsection, 5-genres, 6-likes, 7-dislikes, 8-description
	var re = /<a href="([\S\s]*?)"[\S\s]*?<img src="([\S\s]*?)"[\S\s]*?results-item-title">([\S\s]*?)<\/span>[\S\s]*?results-item-subsection">([\S\s]*?)<\/span>([\S\s]*?)item-rating[\S\s]*?results-item-rating-positive">([\S\s]*?)<\/span>[\S\s]*?results-item-rating-negative">([\S\s]*?)<\/span>[\S\s]*?results-item-description">([\S\s]*?)<\/span>/g;

	function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
	    var response = showtime.httpReq(service.baseUrl + '/search.aspx', {
                args: {
                   search: query,
                   page: fromPage ? fromPage : ''
                }
            }).toString();
            response = response.match(/<div class="b-search-page__results">([\S\s]*?)<\/div>/);
	    page.loading = false;
            if (response) {
                var match = re.exec(response[1]);
                while (match) {
                    var genres = match[5].match(/item-genres">([\S\s]*?)<\/span>/);
                    genres ? genres = ' ' + colorStr(genres[1], orange) : genres = '';
                    var rate = match[6] - match[7];
                    // positve rate = green, negative = red, zero = white
	            if (rate > 0)
		        rate = colorStr('+' + rate.toString(), green);
	            else
                        if (rate < 0)
		            rate = colorStr(rate, red);
                        else
                            rate = '';
                    page.appendItem(plugin.getDescriptor().id + ":listRoot:" + escape(match[1]) + ":" + escape(match[3]), "video", {
                        title: new showtime.RichText(rate + ' ' + match[3]),
                        icon: setIconSize(match[2], 2),
                        genre: new showtime.RichText(match[4] + genres),
                        description: new showtime.RichText('('+coloredStr(match[6], green)+'/'+coloredStr(match[7], red) + ') ' + coloredStr(' Описание: ', orange) + match[8])
                    });
                    page.entries++;
                    match = re.exec(response[1]);
                };
                if (!response[1].match(/<b>Следующая страница<\/b>/))
                   return tryToSearch = false;
                fromPage++;
                return true;
            }
	};
	loader();
	page.paginator = loader;
      });
})(this);