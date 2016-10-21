'use strict';

var DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var BANK_DAYS = 3;
var MINUTE = 1;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var DAY_START = 0;
var DAY_END = 3 * DAY - MINUTE;
var HALF_HOUR = MINUTE * 30;


function isCorrectSchedule(schedule) {
    var keys = Object.keys(schedule);

    if (keys.length !== 3) {
        return false;
    }

    var isCorrect = true;
    for (var i = 0; i < keys.length; ++i) {
        if (schedule[keys[i]].length === 0) {
            isCorrect = false;
            break;
        }
    }

    return isCorrect;
}

function getTimezone(time) {
    time = /(\d{2}):(\d{2})\+(\d+)/.exec(time);

    return parseInt(time[3], 10) * HOUR;
}

function convertTime(time, timezone) {
    time = /(\d{2}):(\d{2})\+(\d+)/.exec(time);

    return parseInt(time[1], 10) * HOUR +
           parseInt(time[2], 10) * MINUTE -
           parseInt(time[3], 10) * HOUR +
           timezone;
}

function convertDate(date, timezone) {
    date = date.split(' ');

    return DAYS.indexOf(date[0]) * DAY +
           convertTime(date[1], timezone);
}

function convertWorkingHours(workingHours, timezone) {
    var newWorkingHours = [];
    var timeFrom = convertDate(workingHours.from, timezone);
    var timeTo = convertDate(workingHours.to, timezone);

    for (var i = 0; i < BANK_DAYS; ++i) {
        newWorkingHours.push([
            timeFrom + i * DAY,
            timeTo + i * DAY
        ]);
    }

    return newWorkingHours;
}

function getTimeInterval(persSchedule) {
    var start = DAY_START;
    var result = persSchedule.map(function (item) {
        var time = [start, item[0] - MINUTE];
        start = item[1] + MINUTE;

        return time;
    });

    result.push([start, DAY_END]);

    return result;
}

function convertSchedule(schedule, timezone) {
    var newSchedule = [];
    for (var name in schedule) {
        if (schedule.hasOwnProperty(name)) {
            var persSchedule = schedule[name]
                .map(function (item) {
                    return [
                        convertDate(item.from, timezone),
                        convertDate(item.to, timezone)
                    ];
                })
                .sort(function (i, j) {
                    return i[0] > j[0] ? -1 : 1;
                });

            newSchedule.push(getTimeInterval(persSchedule));
        }
    }

    return newSchedule;
}

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
exports.isStar = true;

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, '10:00+5'
 * @param {String} workingHours.to – Время закрытия, например, '18:00+5'
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var roberyTime = [];

    if (isCorrectSchedule(schedule)) {
        var timezone = getTimezone(workingHours.from);

        workingHours = convertWorkingHours(workingHours, timezone);
        schedule = convertSchedule(schedule, timezone);

        var i = 0;
        var j = 0;
        var k = 0;
        for (var bankTime = 0; bankTime < workingHours.length; ++bankTime) {
            while (i < schedule[0].length) {
                var start = Math.max(
                    workingHours[bankTime][0],
                    schedule[0][0],
                    schedule[1][0],
                    schedule[2][0]
                );
                var finish = Math.min(
                    workingHours[bankTime][1],
                    schedule[0][1],
                    schedule[1][1],
                    schedule[2][1]
                );

                while (start + duration <= finish) {
                    roberyTime.push([start, finish]);
                    start += HALF_HOUR;
                }

                if (++k === schedule[2].length) {
                    k = 0;
                    if (++j === schedule[1].length) {
                        j = 0;
                        ++i;
                    }
                }
            }
        }
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (roberyTime.length !== 0) {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   'Начинаем в %HH:%MM (%DD)' -> 'Начинаем в 14:59 (СР)'
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            var time = roberyTime[0][0];
            var day = Math.floor(time / DAY);
            time %= DAY;

            var hour = Math.floor(time / HOUR)
                .toLocaleString(undefined, { 'minimumIntegerDigits': 2 });
            time %= HOUR;

            var minute = Math.floor(time / MINUTE)
                .toLocaleString(undefined, { 'minimumIntegerDigits': 2 });

            return template.replace('%DD', DAYS[day])
                           .replace('%HH', hour)
                           .replace('%MM', minute);
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            roberyTime.shift();
            if (roberyTime && roberyTime.length !== 0) {
                return true;
            }

            return false;
        }
    };
};
