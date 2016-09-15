/* Defined in: "Textual.app -> Contents -> Resources -> JavaScript -> API -> core.js" */

Textual.viewBodyDidLoad = function()
{
	Textual.fadeOutLoadingScreen(1.00, 0.95);
}

Textual.newMessagePostedToView = function(line)
{
    var element = document.getElementById("line-" + line);

	ConversationTracking.updateNicknameWithNewMessage(element);
}

Textual.nicknameSingleClicked = function(e)
{
	ConversationTracking.nicknameSingleClickEventCallback(e);
}



// ----------------------------------------------------------------------------
// TEXTUAL ADDON
// Twitch emoticons
// By Andy Graulund (electricnet)

// The following section include passages inspired by "Kappa Everywhere",
// a Chrome extension written Eric Bailey (popcorncolonel).
// https://github.com/popcorncolonel/Chrome-Extensions

app.serverAddress(function(serverAddress){
	app.channelName(function(channelName){

		var turnOnTwitchEnhancements = /^199\.9\.2|^192\.16\.64|twitch\.tv$/.test(serverAddress)

		var emoteUrl = function(id){
			return "//static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-" + id + "-24x18.png"
		}

		var smilies = {
			":Z": { url: emoteUrl("b9cbb6884788aa62") },
			":z": { url: emoteUrl("b9cbb6884788aa62") },
			":-Z": { url: emoteUrl("b9cbb6884788aa62") },
			":-z": { url: emoteUrl("b9cbb6884788aa62") },
			":|": { url: emoteUrl("b9cbb6884788aa62") },
			":-|": { url: emoteUrl("b9cbb6884788aa62") },

			":)": { url: emoteUrl("ebf60cd72f7aa600") },
			":-)": { url: emoteUrl("ebf60cd72f7aa600") },

			":(": { url: emoteUrl("d570c4b3b8d8fc4d") },
			":-(": { url: emoteUrl("d570c4b3b8d8fc4d") },

			":p": { url: emoteUrl("e838e5e34d9f240c") },
			":P": { url: emoteUrl("e838e5e34d9f240c") },
			":-p": { url: emoteUrl("e838e5e34d9f240c") },
			":-P": { url: emoteUrl("e838e5e34d9f240c") },

			";p": { url: emoteUrl("3407bf911ad2fd4a") },
			";-p": { url: emoteUrl("3407bf911ad2fd4a") },
			";P": { url: emoteUrl("3407bf911ad2fd4a") },
			";-P": { url: emoteUrl("3407bf911ad2fd4a") },

			"<3": { url: emoteUrl("577ade91d46d7edc") },

			":/": { url: emoteUrl("374120835234cb29") },
			":-/": { url: emoteUrl("374120835234cb29") },
			":\\": { url: emoteUrl("374120835234cb29") },
			":-\\": { url: emoteUrl("374120835234cb29") },

			";)": { url: emoteUrl("cfaf6eac72fe4de6") },
			";-)": { url: emoteUrl("cfaf6eac72fe4de6") },

			"R)": { url: emoteUrl("0536d670860bf733") },
			"R-)": { url: emoteUrl("0536d670860bf733") },

			"o_O": { url: emoteUrl("8e128fa8dc1de29c") },
			"O_O": { url: emoteUrl("8e128fa8dc1de29c") },
			"o_o": { url: emoteUrl("8e128fa8dc1de29c") },
			"O_o": { url: emoteUrl("8e128fa8dc1de29c") },
			"o.O": { url: emoteUrl("8e128fa8dc1de29c") },
			"O.O": { url: emoteUrl("8e128fa8dc1de29c") },
			"o.o": { url: emoteUrl("8e128fa8dc1de29c") },
			"O.o": { url: emoteUrl("8e128fa8dc1de29c") },

			":D": { url: emoteUrl("9f2ac5d4b53913d7") },
			":-D": { url: emoteUrl("9f2ac5d4b53913d7") },

			":o": { url: emoteUrl("ae4e17f5b9624e2f") },
			":O": { url: emoteUrl("ae4e17f5b9624e2f") },
			":-o": { url: emoteUrl("ae4e17f5b9624e2f") },
			":-O": { url: emoteUrl("ae4e17f5b9624e2f") },

			">(": { url: emoteUrl("d31223e81104544a") },

			"B)": { url: emoteUrl("2cde79cfe74c6169") },
			"B-)": { url: emoteUrl("2cde79cfe74c6169") }
		}

		var filteredEmotes = []
		var twitchEmotes = []

		// Status
		var everythingLoaded = false, globalsLoaded = false, subsLoaded = false,
			sdesLoaded = false, globalFfzsLoaded = false, localFfzsLoaded = false,
			globalBttvsLoaded = false

		if(turnOnTwitchEnhancements){

			// Initial preparations

			var styleEl = document.createElement("style")
			styleEl.innerHTML = " body img.emoticon { display: inline; margin: 0; padding: 0; vertical-align: middle; } "
			document.getElementsByTagName("head")[0].appendChild(styleEl)

			var oldfunc
			if(typeof Textual.newMessagePostedToView == "function"){
				oldfunc = Textual.newMessagePostedToView
			}

			// Fetch emoticons from the server

			// Sub-channels to ignore.
			var ignoredChannels = [];

			var isValidSubEmote = function(emoteCode) {
				return !(filteredEmotes.indexOf(emoteCode) != -1 || // if the user filters it out
						 emoteCode[0].match(/[A-Z]/g) || // if it has no prefix (starts with an uppercase letter
						 emoteCode.match(/^[a-z]+$/g) || // if all lowercase
						 emoteCode.match(/^\d*$/g) //if just a number
						);
			}

			var getEmoteSet = function(url, onData, callback){

				var xhr = new XMLHttpRequest()
				xhr.open("get", url)
				xhr.send()

				xhr.ontimeout = function() {
					if(typeof callback === "function"){
						callback()
					}
				};
				xhr.onload = function() {
					var data = JSON.parse(xhr.responseText)

					if(data && typeof data === "object" && typeof onData === "function"){
						onData(data)
					}
					if(typeof callback === "function"){
						callback()
					}
				}

				return xhr
			}

			var getGlobalEmotes = function() {
				// Expects the following JSON format in response:
				// { meta : {}, template: { small, medium, large }, emotes: {...}}

				// Emote object: { image_id: ... }

				return getEmoteSet(
					"https://twitchemotes.com/api_cache/v2/global.json",
					function(data){
						if("template" in data && "emotes" in data){
							for (var emote in data.emotes) {
								if (filteredEmotes.indexOf(emote) === -1) {
									twitchEmotes[emote] = {
										template: data.template,
										id: data.emotes[emote].image_id
									}
								}
							}
						}
					},
					function(){
						globalsLoaded = true
						getStarted()
					}
				)
			}

			var getSubEmotes = function() {
				// Expects the following JSON format in response:
				// { meta : {}, template: { small, medium, large }, channels: { ...: { emotes: [...] }}}

				// Emote object: { description: ..., image_id: ... }

				return getEmoteSet(
					"https://twitchemotes.com/api_cache/v2/subscriber.json",
					function(data){
						if("template" in data && "channels" in data){
							for (var channelName in data.channels) {
								if(!data.channels.hasOwnProperty(channelName)){
									continue
								}

								var channel = data.channels[channelName]

								for(var i = 0; i < channel.emotes.length; i++){
									var emote = channel.emotes[i], code = emote.code
									if (
										ignoredChannels.indexOf(channelName.toLowerCase()) === -1 &&
										isValidSubEmote(code)
									) {
										twitchEmotes[code] = {
											template: data.template,
											id: emote.image_id,
											channel: channelName
										}
									}
								}
							}
						}
					},
					function(){
						subsLoaded = true
						getStarted()
					}
				)
			}

			var getSdeEmotes = function() {
				// Expects the following JSON format in response:
				// [ { name: ..., url: ...}, ...]

				return getEmoteSet(
					"https://graulund.github.io/secretdungeonemotes/dungeonemotes.json",
					function(data){
						if("length" in data){
							for (var i = 0; i < data.length; i++) {
								var emote = data[i], code = emote.name
								if (filteredEmotes.indexOf(code) === -1) {
									twitchEmotes[code] = {
										url: emote.url
									}
								}
							}
						}
					},
					function(){
						sdesLoaded = true
						getStarted()
					}
				)
			}

			var getFfzEmotes = function(url, channelName, callback) {
				// Expects the following JSON format in response:
				// { sets: { x: { emoticons: [...] }, ... }}

				// Emote object: { name: ..., urls: { 1: ..., 2: ..., 4: ... } }

				if(!(typeof callback === "function")){
					return
				}

				return getEmoteSet(
					url,
					function(data){
						if("sets" in data){
							// Go through each set, and then each emoticon in each set
							for(var num in data.sets){

								if(!data.sets.hasOwnProperty(num)){
									continue
								}

								var set = data.sets[num]

								if("emoticons" in set && "length" in set.emoticons){
									for(var i = 0; i < set.emoticons.length; i++){

										var emote = set.emoticons[i], code = emote.name

										if (filteredEmotes.indexOf(code) === -1) {
											// Assemble srcset and get URL in a way slightly different than normal
											var sources = [], url = ""

											for(var scale in emote.urls){

												if(!emote.urls.hasOwnProperty(scale)){
													continue
												}

												var u = fixUrlScheme(emote.urls[scale])

												// Default URL is the first one we see
												if(url === ""){
													url = u
												}

												sources.push(u + " " + scale + "x")
											}
											// And we have the emote!
											twitchEmotes[code] = {
												url: url,
												srcset: sources.join(", "),
												channel: channelName
											}
										}
									}
								}
							}
						}
						if("room" in data){
							// Storing the data in case it's needed
							window.ffzRoom = data.room
						}
					},
					callback
				)
			}

			var getGlobalFfzEmotes = function(){
				return getFfzEmotes(
					"https://api.frankerfacez.com/v1/set/global",
					"",
					function(){
						globalFfzsLoaded = true
						getStarted()
					}
				)
			}

			var getLocalFfzEmotes = function(){

				var done = function(){
					localFfzsLoaded = true
					getStarted()
				}

				// Get the channel name
				var _channelName = channelName

				if(typeof _channelName === "string"){
					_channelName = _channelName.replace(/^#/, "")

					if(!_channelName){
						// Empty channel name
						return done()
					}
				} else {
					// No channel name
					return done()
				}

				return getFfzEmotes(
					"https://api.frankerfacez.com/v1/room/" + _channelName,
					_channelName,
					done
				)
			}

			var getGlobalBttvEmotes = function() {
				// Expects the following JSON format in response:
				// { status: ..., emotes: [...] }

				// Emote object: { url: ..., regex: ... }
				// URL is always single and ends in 1x, but 2x and 3x versions exist

				return getEmoteSet(
					"https://api.betterttv.net/emotes",
					function(data){
						if("emotes" in data){
							var emotes = data.emotes
							if("length" in emotes){
								for (var i = 0; i < emotes.length; i++) {
									var emote = emotes[i], code = emote.regex
									if (filteredEmotes.indexOf(code) === -1) {
										var emoteData = {
											url: emote.url
										}

										// Assemble srcset
										if(/1x$/.test(emote.url)){
											emoteData.srcset = [
												fixUrlScheme(emote.url) + " 1x",
												fixUrlScheme(emote.url.replace(/1x$/, "2x")) + " 2x",
												fixUrlScheme(emote.url.replace(/1x$/, "3x")) + " 4x"
											].join(", ")
										}

										twitchEmotes[code] = emoteData
									}
								}
							}
						}
					},
					function(){
						globalBttvsLoaded = true
						getStarted()
					}
				)
			}

			// Add emotes to HTML

			var escapeRegExp = function(value){
				return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
			}

			var fixUrlScheme = function(url){
				// Explicit scheme is required in Textual, as it defaults to the file protocol
				if(/^\/\//.test(url)){
					return "http:" + url
				}

				return url
			}

			var emoticonTemplateUrl = function(emote, templateName){
				return fixUrlScheme(emote.template[templateName].replace(/\{image_id\}/g, emote.id))
			}

			var emoticonUrl = function(emote){
				if("template" in emote){
					return emoticonTemplateUrl(emote, "small")
				}

				if("url" in emote){
					return fixUrlScheme(emote.url)
				}

				return ""
			}

			var emoticonSrcset = function(emote){

				if("srcset" in emote){
					return emote.srcset
				}

				var sources = [emoticonUrl(emote) + " 1x"]

				if("template" in emote && "medium" in emote.template){
					sources.push(emoticonTemplateUrl(emote, "medium") + " 2x")
				}

				if("template" in emote && "large" in emote.template){
					sources.push(emoticonTemplateUrl(emote, "large") + " 3x")
				}

				return sources.join(", ")
			}

			var emoticonImg = function(name, emote){

				if(typeof emote !== "object"){
					// Ignore it
					return name
				}

				var fullName = name + ("channel" in emote && emote.channel ? " (" + emote.channel + ")" : "")
				return '<img class="emoticon" src="' + emoticonUrl(emote) +
					'" srcset="' + emoticonSrcset(emote) +
					'" alt="' + name + '" title="' + fullName + '">'
			}

			var replaceEmotesInHTML = function(html){
				// For text-based emoticon codes, let's split by boundary
				var segments = html.split(/\b/g), insideElement = false
				for(var i = 0; i < segments.length; i++){
					var seg = segments[i]

					if(!insideElement && seg.indexOf("<") >= 0){
						insideElement = true
					}

					if(insideElement && seg.indexOf(">") >= 0){
						insideElement = false
					}

					if(!insideElement && twitchEmotes.hasOwnProperty(seg)){
						segments[i] = emoticonImg(seg, twitchEmotes[seg])
					}
				}

				html = segments.join("")

				// For the smilies, do a regex search/replace all the way.

				// First, prevent issues with semicolons
				var entityBreakerCode = "<i></i>"
				html = html.replace(/&([#a-z0-9]+);([\)p-])/gi, "&$1;" + entityBreakerCode + "$2")

				// Now do it
				for(var s in smilies){
					var htmlCode = s.replace(/</g, "&lt;").replace(/>/g, "&gt;")
					var startsAlphanumeric = /^[A-Za-z0-9]/.test(htmlCode)
					var endsAlphanumeric = /[A-Za-z0-9]$/.test(htmlCode)
					var img = emoticonImg(s, smilies[s])
					var regex

					if(s === ":/"){
						// Special case for especially dangerous emote
						regex = /(\s+):\/(\s+)/g
						html = html.replace(regex, "$1" + img + "$2")

					} else {
						regex = new RegExp(
							(startsAlphanumeric ? "\\b" : "(\\b|\\B)") +
							escapeRegExp(htmlCode) +
							(endsAlphanumeric ? "\\b" : "(\\b|\\B)"),
							"g"
						)

						html = html.replace(regex, img)
					}
				}

				// Remove entity breaker code now that we're done
				html = html.replace(new RegExp(escapeRegExp(entityBreakerCode), "g"), "")

				return html
			}

			var replaceEmotesInElement = function(el){
				var html = replaceEmotesInHTML(el.innerHTML), origHtml = el.innerHTML

				if(html != origHtml){
					el.innerHTML = html
				}
			}

			// Add emotes to chat lines

			var replaceEmotesInLine = function(lineEl){

				if(!lineEl){
					return
				}

				if(!everythingLoaded){
					// Don't work if we don't have emotes loaded yet
					return
				}

				if(lineEl.className.indexOf("event") >= 0){
					// Skip event lines
					return
				}

				var emotesAddedClass = "emotes-added"

				if(lineEl.className.indexOf(emotesAddedClass) >= 0){
					// Don't work on a line already worked with
					return
				}

				var innerEl = lineEl.querySelector(".innerMessage")

				if(innerEl){
					replaceEmotesInElement(innerEl)
					lineEl.className = lineEl.className + " " + emotesAddedClass
				}
			}

			var getStarted = function(){
				if(everythingLoaded){
					// We already did what we need to do
					return
				}
				if(
					globalsLoaded && subsLoaded && sdesLoaded &&
					globalFfzsLoaded && localFfzsLoaded &&
					globalBttvsLoaded
				){
					// Let's go!
					everythingLoaded = true

					// Handle already rendered messages
					var lineEls = document.querySelectorAll(".line[ltype='privmsg']")
					for(var i = 0; i < lineEls.length; i++){
						replaceEmotesInLine(lineEls[i])
					}
				}
			}

			// Message event!

			Textual.newMessagePostedToView = function(line){

				var element = document.getElementById("line-" + line)
				replaceEmotesInLine(element)


				if(oldfunc){
					oldfunc(line)
				}
			}

			// Initiate the process
			getGlobalEmotes()
			getSubEmotes()
			getSdeEmotes()
			getGlobalFfzEmotes()
			getLocalFfzEmotes()
			getGlobalBttvEmotes()
		}
	})
})
