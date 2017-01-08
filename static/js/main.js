$(function () {

    //Fetch github data
    $.get("/dev-activity/", function (data) {
        $("#loader").remove();
        $("#development-activity").html(data);
    });

    //Hash generator
    $("#hash-text").on("keyup", function (event) {
        if (event.which != '13') {
            $.post("dohash", {key: $(this).val()}, function (hash) {
                var data = "";
                $.each(hash, function(k, v) {
                    data += $("<tr>").append(
                        $("<td>").text(k),
                        $("<td>").text(v)
                    )[0].outerHTML;
                });
                $("#hash-table").html(data);
            });
        }
    });

    var hexText = $("#hex-text")

    //Hex generator
    $(".hex-type").on("change", function () {
        hexText.trigger("keyup");
    });
    hexText.on("keyup", function () {
        var hexValues = $("#hex-values");
        var type = $(".hex-type:checked").val();
        if (type === "Decimal") {
            hexText.val(hexText.val().replace(/[^0-9]/gi, ""));
            var number = BigInteger.parse(hexText.val().replace(/[A-Za-z]/gi, ""));
            hexValues.text(number.toString(16));
        }
        else {
            var hex = "";
            for (var i = 0; i < hexText.val().length; i++) {
                hex = hex + hexText.val().charCodeAt(i).toString(16);
            }
            hexValues.text(hex);
        }
    });

    //Character counter
    $("#character-box").on("keyup", function () {
        $("#num-characters").html($(this).val().length);
    });

    //Format number with commas
    function numberWithCommas(x) {
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    //Calculate the time necessary to crack a password
    function timeToCrack(combinations, guessesPerSecond) {
        var HOUR = 60;
        var DAY = 1440;
        var WEEK = 10080;
        var MONTH = 43800;
        var YEAR = 525600;

        if (combinations.isZero()) {
            return 0;
        }

        var time = combinations.divide(guessesPerSecond).divide(HOUR);
        if (time.isZero()) {
            return "Less than 1 second!";
        }
        else if (time < HOUR) {
            return BigInteger.toString(time) + " minutes";
        }
        else if (time > HOUR && time < DAY) {
            return BigInteger.toString(time.divide(HOUR)) + " hours";
        }
        else if (time > DAY && time < WEEK) {
            return BigInteger.toString(time.divide(DAY)) + " days";
        }
        else if (time > WEEK && time < MONTH) {
            return BigInteger.toString(time.divide(WEEK)) + " weeks";
        }
        else if (time > MONTH && time < YEAR) {
            return BigInteger.toString(time.divide(MONTH)) + " months";
        }
        else if (time > YEAR) {
            return numberWithCommas(BigInteger.toString(time.divide(YEAR)) + " years");
        }
    }

    //Complexity meter calculations and animations
    function complexitySlider(amount) {
        var bar = $("#password-complexity-meter");
        if (amount < 40) {
            bar.removeClass("progress-bar-warning progress-bar-info progress-bar-success");
            bar.addClass("progress-bar-danger");
        }
        else if (amount >= 40 && amount < 70) {
            bar.removeClass("progress-bar-danger progress-bar-info progress-bar-success");
            bar.addClass("progress-bar-warning");
        }
        else if (amount >= 80 && amount < 100) {
            bar.removeClass("progress-bar-warning progress-bar-danger progress-bar-success");
            bar.addClass("progress-bar-info");
        }
        else if (amount == 100) {
            bar.removeClass("progress-bar-warning progress-bar-danger progress-bar-info");
            bar.addClass("progress-bar-success");
        }

        var width = bar[0].style.width;
        if (width.substring(0, width.length - 1) != amount) {
            bar.stop().attr("aria-valuenow", amount).animate({"width": amount + "%"}, 50);
        }
    }

    //Password strength analyzer
    $("#analyze-password").on("keyup", function () {
        var searchSpace = 0;
        var combinations = BigInteger(0);
        var input = $(this).val();
        var length = input.length;
        var complexity = 0;

        if (input.match(/[a-z]/g)) {
            searchSpace += 26;
            complexity += 10;
        }

        if (input.match(/[A-Z]/g)) {
            searchSpace += 26;
            complexity += 10;
        }

        if (input.match(/[0-9]/g)) {
            searchSpace += 10;
            complexity += 10;
        }

        if (input.match(/\W/g)) {
            searchSpace += 33;
            complexity += 10;
        }

        if (length >= 8) {
            complexity += 10;
        }
        if (length >= 9) {
            complexity += 10;
        }
        if (length >= 10) {
            complexity += 10;
        }
        if (length >= 11) {
            complexity += 10;
        }
        if (length >= 12) {
            complexity += 10;
        }
        if (length >= 13) {
            complexity += 10;
        }

        var base = BigInteger(searchSpace);
        for (var i = 1; i <= length; i++) {
            var raised = base.pow(i);
            combinations = combinations.add(raised);
        }

        complexitySlider(complexity);

        $("#password-search-space").text(searchSpace);
        $("#password-length").text(length);
        $("#password-combinations").text(numberWithCommas(BigInteger.toString(combinations)));

        $("#cpu-scenario").text(timeToCrack(combinations, 4500));
        $("#gpu-scenario").text(timeToCrack(combinations, 700000000));

        $("#my-cpu").text(timeToCrack(combinations, 8000));
        $("#my-gpu").text(timeToCrack(combinations, 2500000000));

        $("#group-cpu").text(timeToCrack(combinations, 1000000));
        $("#group-gpu").text(timeToCrack(combinations, 500000000000));
    });

});
