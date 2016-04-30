var suggstFactories = angular.module('suggstFactories', []);

suggstFactories.factory('suggestFactory', function ($http, $filter) {

    //Add format() to String.prototype
    if (!String.prototype.format) {
        String.prototype.format = function () {
            var str = this.toString();
            if (!arguments.length)
                return str;
            var args = typeof arguments[0],
                args = (("string" == args || "number" == args) ? arguments : arguments[0]);
            for (arg in args)
                str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
            return str;
        }
    }

    var spotifyToken;
    var frequencyList = [];
    var totalNumber = 0;
    var counter;

    var lineTemplates = {
        firstLineTemplate: 'I\'ve found, that you enjoy listening to <span class="active">{artist}</span>',
        secondLineTemplates: ['You kinda like <span class="active">{artist_one}</span> and <span class="active">{artist_two}</span>',
                               '<span class="active">{artist_one}</span> and <span class="active">{artist_two}</span> are also your favourites',
                               'You seem to really like <span class="active">{artist_one}</span> and <span class="active">{artist_two}</span>'],
        thirdLineTemplates: ['<span class="active">{artist}</span> is your sort of music too',
                              '<span class="active">{artist}</span> rocks, right?',
                              'A fan of <span class="active">{artist}</span>, eh?']
    };

    var errorTemplates = {
        networkErrorTemplate: ['Oops. There seems to be something <span class="active">wrong</span> with the <span class="active">network</span>', 'Please click <span class="active"><a href="/authenticate">here</a></span> to try again'],

        musicErrorTemplate: {
            noMusicFound: ['Oops. It seems that you don\'t have <span class="active">any</span> music in your <span class="active">library</span>', 'Please <span class="active">add</span> some and <span class="active">come back</span>'],
            littleMusicFound: ['Oops. It seems that you don\'t have <span class="active">enough</span> music in your <span class="active">library</span>', 'Please <span class="active">add</span> some and <span class="active">come back</span>']
        }
    };

    //Add to library methods. I had to resort to $.ajax(), as angular's $http for unknown reason could not handle url parameters in DELETE and PUT requests
    var removeTrack = function (trackid, callback) {
        $.ajax({
            url: 'https://api.spotify.com/v1/me/tracks?ids=' + trackid,
            method: 'DELETE',
            dataType: "text",
            headers: {
                'Authorization': 'Bearer ' + spotifyToken
            },
            success: function (response) {
                callback();
            },
            error: function (jqXHR, textStatus, error) {
                console.log('Error: %o', error);
            }
        });
    }

    var saveTrack = function (trackid, callback) {
        $.ajax({
            url: 'https://api.spotify.com/v1/me/tracks?ids=' + trackid,
            method: 'PUT',
            dataType: "text",
            headers: {
                'Authorization': 'Bearer ' + spotifyToken
            },
            success: function (response) {
                callback();
            },
            error: function (jqXHR, textStatus, error) {
                console.log('Error: %o', error);
            }
        });
    }

    var checkIfTrackIsSaved = function (trackid, callback) {
        $http.get('https://api.spotify.com/v1/me/tracks/contains?ids=' + trackid, {
            headers: {
                'Authorization': 'Bearer ' + spotifyToken
            }
        }).
        success(function (data, status) {
            callback(data[0]);
        }).
        error(function (data, status) {
            console.log('Error: %o', data);
        });
    }

    var getRandom = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var getRelatedArtist = function (artist_id, consoleData, callback) {
        $http.get('https://api.spotify.com/v1/artists/' + artist_id.split(':')[2] + '/related-artists', {
            headers: {
                'Authorization': 'Bearer ' + spotifyToken
            }
        }).
        success(function (data, status) {
            if (data.artists.length >= 4) {
                getTopSong(data.artists[getRandom(0, 3)].uri, consoleData, callback, 5);
            } else {
                getTopSong(data.artists[0].uri, consoleData, callback, 5);
            }
        }).
        error(function (data, status) {
            console.log('Error: %o', data);
            callback({
                message: errorTemplates.networkErrorTemplate
            }, null);
        });
    }

    var getTopSong = function (artist_id, consoleData, callback, tries) {
        $http.get('https://api.spotify.com/v1/artists/' + artist_id.split(':')[2] + '/top-tracks?country=US', {
            headers: {
                'Authorization': 'Bearer ' + spotifyToken
            }
        }).
        success(function (data, status) {
            var song = data.tracks[getRandom(0, 9)];
            checkIfTrackIsSaved(song.id, function (saved) {
                if (!saved || tries == 0) {
                    callback(null, [{
                        firstLine: consoleData.firstLine,
                        secondLine: consoleData.secondLine,
                        thirdLine: consoleData.thirdLine,
                        }, {
                        firstBackground: consoleData.frontBackground,
                        secondBackground: song.album.images[0].url
                        }, {
                        id: song.id,
                        title: song.name,
                        album: song.album.name,
                        artist: song.artists[0].name,
                        cover: song.album.images[0].url,
                        preview: song.preview_url,
                        url: song.external_urls.spotify
                        }]);
                } else {
                    tries--;
                    getTopSong(artist_id, consoleData, callback, tries);
                }
            });
        }).
        error(function (data, status) {
            console.log('Error: %o', data);
            callback({
                message: errorTemplates.networkErrorTemplate
            }, null);
        });
    }

    var chooseRandomArtists = function (callback) {

        var uniqueRandoms = [];
        var numRandoms = frequencyList.length;

        var generateUniqueRandom = function () {
            if (!uniqueRandoms.length) {
                for (var i = 0; i < numRandoms; i++) {
                    uniqueRandoms.push(i);
                }
            }
            var index = Math.floor(Math.random() * uniqueRandoms.length);
            var val = uniqueRandoms[index];
            uniqueRandoms.splice(index, 1);
            return val;
        }

        var firstChoice = frequencyList[generateUniqueRandom()];
        var secondChoice_one = frequencyList[generateUniqueRandom()];
        var secondChoice_two = frequencyList[generateUniqueRandom()];
        var thirdChoice = frequencyList[generateUniqueRandom()];

        var firstLine = lineTemplates.firstLineTemplate.format({
            artist: firstChoice.artist
        });

        var secondFrequency = ((secondChoice_one.frequency / totalNumber) + (secondChoice_two.frequency / totalNumber)) / 2;
        if (secondFrequency >= 0.1) {
            var secondIndex = 2;
        } else if (secondFrequency < 0.1 && secondFrequency > 0.005) {
            var secondIndex = 1;
        } else {
            var secondIndex = 0;
        }

        var secondLine = lineTemplates.secondLineTemplates[secondIndex].format({
            artist_one: secondChoice_one.artist,
            artist_two: secondChoice_two.artist
        });

        var thirdFrequency = thirdChoice.frequency / totalNumber;
        if (secondFrequency >= 0.1) {
            var thirdIndex = 2;
        } else if (secondFrequency < 0.1 && secondFrequency > 0.005) {
            var thirdIndex = 1;
        } else {
            var thirdIndex = 0;
        }

        var thirdLine = lineTemplates.thirdLineTemplates[thirdIndex].format({
            artist: thirdChoice.artist
        });

        if (getRandom(0, 5) == 0) {
            getTopSong(firstChoice.artist_id, {
                firstLine: firstLine,
                secondLine: secondLine,
                thirdLine: thirdLine,
                frontBackground: firstChoice.cover
            }, callback, 5);
        } else {
            getRelatedArtist(firstChoice.artist_id, {
                firstLine: firstLine,
                secondLine: secondLine,
                thirdLine: thirdLine,
                frontBackground: firstChoice.cover
            }, callback);
        }
    }

    var pushToFrequencyList = function (item) {
        var exists = false;
        angular.forEach(frequencyList, function (song, key) {
            if (song.artist_id === item.artist_id) {
                song.frequency = song.frequency + 1;
                exists = true;
            }
        });
        if (!exists) {
            frequencyList.push({
                artist: item.artist,
                artist_id: item.artist_id,
                cover: item.cover,
                frequency: 1
            });
        }
        totalNumber++;
    }

    var createFrequencyList = function (url, callback) {
        $http.get(url, {
            headers: {
                'Authorization': 'Bearer ' + spotifyToken
            },
            params: {
                limit: 50
            }
        }).
        success(function (tracks, status) {
            if (tracks.next && counter > 0) {
                angular.forEach(tracks.items, function (song, key) {
                    pushToFrequencyList({
                        artist: song.track.artists[0].name,
                        artist_id: song.track.artists[0].uri,
                        cover: song.track.album.images[0].url
                    });
                });
                counter--;
                createFrequencyList(tracks.next, callback);
            } else {
                if (frequencyList.length == 0) {
                    callback({
                        message: errorTemplates.musicErrorTemplate.noMusicFound
                    }, null);
                } else if (frequencyList.length < 4) {
                    callback({
                        message: errorTemplates.musicErrorTemplate.littleMusicFound
                    }, null);
                } else if (frequencyList.length >= 10) {
                    frequencyList = $filter('orderBy')(frequencyList, '-frequency').splice(0, 10);
                    chooseRandomArtists(callback);
                } else {
                    frequencyList = $filter('orderBy')(frequencyList, '-frequency');
                    chooseRandomArtists(callback);
                }
            }
        }).
        error(function (data, status) {
            console.log('Error: %o', data);
            callback({
                message: errorTemplates.networkErrorTemplate
            }, null);
        });

    }

    var fetchSavedTracks = function (limit, callback) {
        var url = 'https://api.spotify.com/v1/me/tracks';
        counter = limit;
        createFrequencyList(url, callback);
    }

    var getName = function (callback) {
        $http.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': 'Bearer ' + spotifyToken
            }
        }).
        success(function (data, status) {
            callback(null, data.display_name);
        }).
        error(function (data, status) {
            console.log('Error: %o', data);
            callback({
                message: errorTemplates.networkErrorTemplate
            }, null);
        });
    }

    return {
        setAccessToken: function (accessToken) {
            spotifyToken = accessToken;
        },
        getName: function (callback) {
            getName(callback);
        },
        getApplicationData: function (limit, callback) {
            fetchSavedTracks(limit, callback);
        },
        checkIfTrackIsSaved: function (trackid, callback) {
            checkIfTrackIsSaved(trackid, callback);
        },
        addTrackToLibrary: function (trackid, callback) {
            saveTrack(trackid, callback);
        },
        removeTrackFromLibrary: function (trackid, callback) {
            removeTrack(trackid, callback);
        }
    }
});