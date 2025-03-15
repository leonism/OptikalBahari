(function ($) {
    "use strict";

    // Form handling (original)
    $("body")
        .on("input propertychange", ".floating-label-form-group", function (i) {
            $(this).toggleClass("floating-label-form-group-with-value", !!$(i.target).val());
        })
        .on("focus", ".floating-label-form-group", function () {
            $(this).addClass("floating-label-form-group-with-focus");
        })
        .on("blur", ".floating-label-form-group", function () {
            $(this).removeClass("floating-label-form-group-with-focus");
        });

    // Navbar scroll behavior (original)
    var i = $("#mainNav").height();
    $(window).on("scroll", { previousTop: 0 }, function () {
        var s = $(window).scrollTop();
        s < this.previousTop
            ? s > 0 && $("#mainNav").hasClass("is-fixed")
                ? $("#mainNav").addClass("is-visible")
                : $("#mainNav").removeClass("is-visible is-fixed")
            : ($("#mainNav").removeClass("is-visible"), s > i && !$("#mainNav").hasClass("is-fixed") && $("#mainNav").addClass("is-fixed"));
        this.previousTop = s;
    });

    // Click-outside to close navbar and search (original)
    $(document).ready(function () {
        $(document).click(function (a) {
            let i = $(".navbar-toggler"),
                s = $(".navbar-collapse"),
                o = $("#search-google");
            !i.is(a.target) && !s.is(a.target) && 0 === s.has(a.target).length && !o.is(a.target) && 0 === o.has(a.target).length && s.hasClass("show") && i.click();
        });

        // Dark mode toggle (consolidated)
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            $('body').addClass('dark-mode');
            $('#themeToggle').prop('checked', true);
        }

        $('#themeToggle').on('change', function () {
            $('body').toggleClass('dark-mode');
            localStorage.setItem('theme', $(this).is(':checked') ? 'dark' : 'light');
        });
    });

})(jQuery);
