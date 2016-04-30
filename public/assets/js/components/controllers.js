var suggstControllers = angular.module('suggstControllers', []);

// Filter for bypassing Angular anti-xss policy
suggstControllers.filter('toHtml', ['$sce', function ($sce) {
    return function (text) {
        return $sce.trustAsHtml(text);
    };
}]);

suggstControllers.controller('LoginController', ['$scope',
 function ($scope) {
        $scope.init = function () {
            resizeFunc();
        }
}]);

suggstControllers.controller('MainController', ['$scope', '$location', 'suggestFactory',
 function ($scope, $location, suggestFactory) {

        // User name
        $scope.userName = 'Guest';

        // App data models
        $scope.consoleData = {};
        $scope.suggestData = {};
        $scope.backgroundData = {};
        $scope.shareData = {};

        // Audio controls
        $scope.audio = new Audio();
        $scope.hasStarted = false;
        $scope.isPlaying = 0;

        // Is suggested track already in library?
        $scope.inLibrary = false;

        $scope.getAppData = function () {
            //get maximum 3 * 50 songs for analysis
            suggestFactory.getApplicationData(3, function (error, data) {
                if (error) {
                    $scope.consoleData.firstLine = error.message[0];
                    $scope.consoleData.secondLine = error.message[1];
                    $scope.stage_error_two();
                } else {
                    //load app data
                    $scope.consoleData = data[0];
                    $scope.backgroundData = data[1];
                    $scope.suggestData = data[2];

                    //preload audio playback
                    $scope.addEndedListener();
                    $scope.addRouteChangeListener();
                    $scope.loadAudio($scope.suggestData.preview);
                    $scope.stage_two();
                }
            });
        };

        // UX control
        $scope.changeFirstBackground = function () {
            $('#bg1').fadeOut(500, 'linear', function () {
                $('#bg1').hide();
            });
        };

        $scope.changeSecondBackground = function () {
            $('#bg2').fadeOut(500, 'linear', function () {
                $('#bg2').hide();
            });
        };

        $scope.hideSpinner = function () {
            $('#waitspinner').hide();
        };


        $scope.hideConsole = function () {
            $('.console').hide();
        };

        $scope.showSuggest = function () {
            $('.suggest').show();
        };

        $scope.stage_one = function () {
            $('#line1').animo({
                animation: "fadeIn",
                duration: 0.4,
                timing: "ease-in-out",
                keep: true
            }, function () {
                $('#line2').animo({
                    animation: "fadeIn",
                    duration: 0.4,
                    timing: "ease-in-out",
                    keep: true
                });
            });
        };

        $scope.stage_two = function () {
            $scope.hideSpinner();
            $scope.changeFirstBackground();
            $('#line3').animo({
                animation: "fadeIn",
                duration: 1,
                timing: "ease-in-out",
                keep: true
            }, function () {
                $('#line4').animo({
                    animation: "fadeIn",
                    duration: 1,
                    timing: "ease-in-out",
                    keep: true
                }, function () {
                    $('#line5').animo({
                        animation: "fadeIn",
                        duration: 1,
                        timing: "ease-in-out",
                        keep: true
                    }, function () {
                        $('#line6').animo({
                            animation: "fadeIn",
                            duration: 1,
                            timing: "ease-in-out",
                            keep: true
                        }, function () {
                            $('.console').animo({
                                animation: "fadeOut",
                                duration: 2,
                                timing: "ease-in-out",
                                keep: true
                            }, function () {
                                setTimeout($scope.stage_three, 2000);
                            });
                        });
                    });
                });
            });
        };

        $scope.stage_three = function () {
            $scope.hideConsole();
            $scope.changeSecondBackground();
            $scope.showSuggest();
            $('.suggest').animo({
                animation: "fadeIn",
                duration: 1,
                timing: "ease-in-out",
                keep: true
            });
        };

        $scope.stage_error_two = function () {
            $scope.hideSpinner();
            $('#line3').animo({
                animation: "fadeIn",
                duration: 1,
                timing: "ease-in-out",
                keep: true
            }, function () {
                $('#line4').animo({
                    animation: "fadeIn",
                    duration: 1,
                    timing: "ease-in-out",
                    keep: true
                });
            });
        };

        // Audio playback control
        $scope.addRouteChangeListener = function () {
            $scope.$on('$routeChangeStart', function (next, current) {
                if ($scope.isPlaying) {
                    $scope.pause();
                }
            });
        };

        $scope.addEndedListener = function () {
            $scope.audio.addEventListener("ended", function () {
                $scope.hasStarted = false;
                $scope.$apply(function () {
                    $scope.isPlaying = 2;
                });
            });
        };

        $scope.loadAudio = function (url) {
            $scope.audio.src = url;
        };

        $scope.play = function () {
            $scope.audio.play();
            $($scope.audio).animate({
                volume: 1
            }, 200);
            $scope.isPlaying = 1;
        };

        $scope.pause = function () {
            $($scope.audio).animate({
                volume: 0
            }, 200, 'swing', function () {
                $scope.audio.pause();
            });
            $scope.isPlaying = 0;
        };

        $scope.togglePlayback = function () {

            if (!$scope.hasStarted) {
                $scope.audio.volume = 0;
                $scope.hasStarted = true;
            }

            switch ($scope.isPlaying) {
            case 1:
                $scope.pause();
                break;
            case 2:
            case 0:
                $scope.play();
                break;
            }
        };

        //Open in Spotify function
        $scope.openInSpotify = function () {
            if ($scope.isPlaying) {
                $scope.pause();
            }
            window.open($scope.suggestData.url, '_blank');
        };

        //Save track to Spotify music library function
        $scope.saveTrack = function () {
            switch ($scope.inLibrary) {
            case true:
                suggestFactory.removeTrackFromLibrary($scope.suggestData.id, function () {
                    $scope.$apply(function () {
                        $scope.inLibrary = false;
                    });
                });
                break;
            case false:
                suggestFactory.addTrackToLibrary($scope.suggestData.id, function () {
                    $scope.$apply(function () {
                        $scope.inLibrary = true;
                    });
                });
                break;
            }
        };

        // Sharing functions
        $scope.openTwitterPopup = function () {
            var w = 650;
            var h = 300;
            var left = Number((screen.width / 2) - (w / 2));
            var tops = Number((screen.height / 2) - (h / 1.1));
            var twitterString = 'https://twitter.com/intent/tweet?text=I%27ve%20just%20discovered%20"' + $scope.suggestData.title + '"%20by%20' + $scope.suggestData.artist + '&via=suggstapp&url=http%3A%2F%2Fsuggst.net%2F';
            window.open(twitterString, 'Share on Twitter', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + tops + ', left=' + left);
        };

        $scope.openFacebookPopup = function () {
            FB.ui({
                method: 'feed',
                name: 'Just discovered "' + $scope.suggestData.title + '" on Suggst',
                link: 'http://suggst.net/',
                caption: 'suggst.net',
                picture: $scope.suggestData.cover,
                description: 'I\'ve just discovered "' + $scope.suggestData.title + '" by ' + $scope.suggestData.artist + ' using Suggst. Try it out too!',
            }, function (response) {

            });
        };

        // Initialize app
        $scope.init = function () {
            resizeFunc();
            suggestFactory.setAccessToken($location.search().token);
            $scope.getAppData();
            suggestFactory.getName(function (error, name) {
                if (!error) {
                    $scope.userName = name;
                }
                $scope.stage_one();
            });
        };

}]);