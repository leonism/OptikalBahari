!(function (a) {
    "use strict";
    a("body")
        .on("input propertychange", ".floating-label-form-group", function (i) {
            a(this).toggleClass("floating-label-form-group-with-value", !!a(i.target).val());
        })
        .on("focus", ".floating-label-form-group", function () {
            a(this).addClass("floating-label-form-group-with-focus");
        })
        .on("blur", ".floating-label-form-group", function () {
            a(this).removeClass("floating-label-form-group-with-focus");
        });
    var i = a("#mainNav").height();
    a(window).on("scroll", { previousTop: 0 }, function () {
        var s = a(window).scrollTop();
        s < this.previousTop
            ? s > 0 && a("#mainNav").hasClass("is-fixed")
                ? a("#mainNav").addClass("is-visible")
                : a("#mainNav").removeClass("is-visible is-fixed")
            : (a("#mainNav").removeClass("is-visible"), s > i && !a("#mainNav").hasClass("is-fixed") && a("#mainNav").addClass("is-fixed")),
            (this.previousTop = s);
    }),
        $(document).ready(function () {
            $(document).click(function (a) {
                let i = $(".navbar-toggler"),
                    s = $(".navbar-collapse"),
                    o = $("#search-google");
                !i.is(a.target) && !s.is(a.target) && 0 === s.has(a.target).length && !o.is(a.target) && 0 === o.has(a.target).length && s.hasClass("show") && i.click();
            });
        });
})(jQuery);
