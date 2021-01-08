$(function () {

    // Fetch github data.
    if (window.location.pathname === "/") {
        $.get("/dev-activity/", function (data) {
            $("#loader").remove();
            $("#development-activity").html(data);
        });
    }

    // Hash generator.
    var hashCache = {};
    var hashTable = $("#hash-table");
    $("#hash-text").on("keyup", function (event) {
        var key = $(this).val();
        if (event.which != '13') {
            if (hashCache[key] !== undefined) {
                hashTable.html(hashCache[key]);
                return;
            }

            $.post("dohash", {key}, function (hash) {
                var data = "";
                $.each(hash, function (k, v) {
                    data += $("<tr>").append(
                        $("<td>").text(k),
                        $("<td>").text(v)
                    )[0].outerHTML;
                });
                hashTable.html(data);
                hashCache[key] = data;
            });
        }
    });

    // Hex generator.
    var hexText = $("#hex-text")
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
            return;
        }

        var hex = "";
        for (var i = 0; i < hexText.val().length; i++) {
            hex = hex + hexText.val().charCodeAt(i).toString(16);
        }

        hexValues.text(hex);
    });

    // Character counter.
    var numCharacters = $("#num-characters");
    $("#character-box").on("keyup", function () {
        numCharacters.html($(this).val().length);
    });

    // Format number with commas.
    function numberWithCommas(x) {
        var parts = x.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    // Calculate the time necessary to crack a password.
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

        if (time < HOUR) {
            return BigInteger.toString(time) + " minutes";
        }

        if (time > HOUR && time < DAY) {
            return BigInteger.toString(time.divide(HOUR)) + " hours";
        }

        if (time > DAY && time < WEEK) {
            return BigInteger.toString(time.divide(DAY)) + " days";
        }

        if (time > WEEK && time < MONTH) {
            return BigInteger.toString(time.divide(WEEK)) + " weeks";
        }

        if (time > MONTH && time < YEAR) {
            return BigInteger.toString(time.divide(MONTH)) + " months";
        }

        if (time > YEAR) {
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

    // Password strength analyzer.
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

        for (var i = 8; i <= 13; i++) {
            if (length >= i) {
                complexity += 10;
            }
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
