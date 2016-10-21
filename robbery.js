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
        if (schedule[key[i]].length === 0) {
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
    date = date.split(" ");

    return DAYS.indexOf(date[0]) * DAY +
           convertTime(date[1], timezone);
}

function convertWorkingHours(workingHours, timezone) {
    var newWorkingHours = [];
    var timeFrom = convertDate(workingHours['from'], timezone);
    var timeTo = convertDate(workingHours['to'], timezone);

    for (var i = 0; i < BANK_DAYS; ++i) {
        newWorkingHours.push([
            timeFrom + i * DAY,
            timeTo + i * DAY
        ]);
    }

    return newWorkingHours;
}

function convertSchedule(schedule, timezone) {
    var newSchedule = [];
    for (var name in schedule) {
        if (schedule.hasOwnProperty(name)) {
            var persSchedule = schedule[name]
                .map(function (item) {
                    return [
                        convertDate(item['from'], timezone),
                        convertDate(item['to'], timezone)
                    ];
                })
                .sort(function (i, j) {
                    return i[0] > j[0] ? -1 : 1;
                });

            var start = DAY_START;
            newSchedule.push(persSchedule
                .map(function (item) {
                    var time = [start, item[0] - MINUTE];
                    start = item[1] + MINUTE;
                    return time;
                })
                .push([start, DAY_END])
            );
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
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var roberyTime = [];

    if (isCorrectSchedule(schedule)) {
        var timezone = getTimezone(workingHours['from']);

        workingHours = convertWorkingHours(workingHours, timezone);
        schedule = convertSchedule(schedule, timezone);

        workingHours.forEach(function (bankTime) {
            schedule[0].forEach(function (i) {
                schedule[1].forEach(function (j) {
                    schedule[2].forEach(function (k) {
                        var start = Math.min(i[0], j[0], k[0]);
                        var finish = Math.min(i[1], j[1], k[1]);

                        while (start + duration <= finish) {
                            roberyTime.push([start, finish]);
                            start += HALF_HOUR;
                        }
                    });
                });
            });
        });
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
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            var time = roberyTime[0][0];
            var day = Math.floor(time / DAY);
            time %= DAY;
            var hour = Math.floor(time / HOUR);
            time %= HOUR;
            var minute = Math.floor(time / MINUTE);

            return template.replace("%DD", DAYS[day])
                           .replace("%HH", hour.toLocaleString(undefined, { 'minimumIntegerDigits': 2 }))
                           .replace("%MM", minute.toLocaleString(undefined, { 'minimumIntegerDigits': 2 }));
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
