window.resizeFunc = function () {
    if ((window.innerWidth / window.innerHeight) >= 1) {
        $('.bg img').removeClass('fullHeight');
        $('.bg img').addClass('fullWidth');
    } else {
        $('.bg img').addClass('fullHeight');
        $('.bg img').removeClass('fullWidth');
    }
}

$(window).on('resize', resizeFunc);