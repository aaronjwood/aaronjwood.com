$(function () {

    // Hash generator.
    var hashCache = {};
    var hashTable = $("#hash-table");
    $("#hash-text").on("keyup", function (event) {
        var text = $(this).val();
        if (hashCache[text] !== undefined) {
            hashTable.html(hashCache[text]);
            return;
        }

        $.post({
            url: "do",
            data: JSON.stringify({text: text}),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (hashes) {
                var data = "";
                $.each(hashes, function (k, v) {
                    data += $("<tr>").append(
                        $("<td>").text(k),
                        $("<td>").text(v)
                    )[0].outerHTML;
                });
                hashTable.html(data);
                hashCache[text] = data;
            }
        });
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
            var number = BigInt(hexText.val().replace(/[A-Za-z]/gi, ""));
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
        var HOUR = 60n;
        var DAY = 1440n;
        var WEEK = 10080n;
        var MONTH = 43800n;
        var YEAR = 525600n;

        if (combinations === BigInt(0)) {
            return 0;
        }

        var time = combinations / BigInt(guessesPerSecond) / HOUR;
        if (time === BigInt(0)) {
            return "Less than 1 second!";
        }

        if (time < HOUR) {
            return time + " minutes";
        }

        if (time > HOUR && time < DAY) {
            return time / HOUR + " hours";
        }

        if (time > DAY && time < WEEK) {
            return time / DAY + " days";
        }

        if (time > WEEK && time < MONTH) {
            return time / WEEK + " weeks";
        }

        if (time > MONTH && time < YEAR) {
            return time / MONTH + " months";
        }

        if (time > YEAR) {
            return numberWithCommas(time / YEAR + " years");
        }
    }

    //Complexity meter calculations and animations
    function complexitySlider(amount) {
        var bar = $("#password-complexity-meter");
        if (amount < 40) {
            bar.removeClass("bg-warning bg-info bg-success");
            bar.addClass("bg-danger");
        }
        else if (amount >= 40 && amount < 70) {
            bar.removeClass("bg-danger bg-info bg-success");
            bar.addClass("bg-warning");
        }
        else if (amount >= 80 && amount < 100) {
            bar.removeClass("bg-warning bg-danger bg-success");
            bar.addClass("bg-info");
        }
        else if (amount == 100) {
            bar.removeClass("bg-warning bg-danger bg-info");
            bar.addClass("bg-success");
        }

        var width = bar[0].style.width;
        if (width.substring(0, width.length - 1) != amount) {
            bar.stop().attr("aria-valuenow", amount).animate({ "width": amount + "%" }, 50);
        }
    }

    // Password strength analyzer.
    $("#analyze-password").on("keyup", function () {
        var searchSpace = 0n;
        var combinations = 0n;
        var input = $(this).val();
        var length = input.length;
        var complexity = 0;

        if (input.match(/[a-z]/g)) {
            searchSpace += 26n;
            complexity += 10;
        }

        if (input.match(/[A-Z]/g)) {
            searchSpace += 26n;
            complexity += 10;
        }

        if (input.match(/[0-9]/g)) {
            searchSpace += 10n;
            complexity += 10;
        }

        if (input.match(/\W/g)) {
            searchSpace += 33n;
            complexity += 10;
        }

        for (var i = 8; i <= 13; i++) {
            if (length >= i) {
                complexity += 10;
            }
        }

        for (var i = 1; i <= length; i++) {
            combinations += searchSpace ** BigInt(i);
        }

        complexitySlider(complexity);

        $("#password-search-space").text(searchSpace);
        $("#password-length").text(length);
        $("#password-combinations").text(numberWithCommas(combinations));

        $("#cpu-scenario").text(timeToCrack(combinations, 4500));
        $("#gpu-scenario").text(timeToCrack(combinations, 700000000));

        $("#my-cpu").text(timeToCrack(combinations, 8000));
        $("#my-gpu").text(timeToCrack(combinations, 2500000000));

        $("#group-cpu").text(timeToCrack(combinations, 1000000));
        $("#group-gpu").text(timeToCrack(combinations, 500000000000));
    });

});
