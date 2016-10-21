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
    var timeFrom = convertTime(workingHours.from, timezone);
    var timeTo = convertTime(workingHours.to, timezone);

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

function getRobberyInterval(start, finish, duration) {
    var robberyInterval = [];

    while (start + duration <= finish) {
        robberyInterval.push([start, finish]);
        start += HALF_HOUR;
    }

    return robberyInterval;
}

function incIter(iter, iterMax) {
    for (var i = iter.length - 1; i >= 0; --i) {
        if (++iter[i] === iterMax[i].length) {
            iter[i] = 0;
        } else {
            break;
        }
    }

    return iter;
}

function getRobberyTimes(schedule, duration, workingHours) {
    var robberyTimes = [];
    var bankTime = 0;
    var iter = [0, 0, 0];
    var iterMax = [schedule[0].length, schedule[1].length, schedule[2].length];

    while (bankTime < workingHours.length) {
        robberyTimes.concat(getRobberyInterval(
            Math.max(
                workingHours[bankTime][0],
                schedule[iter[0]][0],
                schedule[iter[1]][0],
                schedule[iter[2]][0]
            ),
            Math.min(
                workingHours[bankTime][1],
                schedule[iter[0]][1],
                schedule[iter[1]][1],
                schedule[iter[2]][1]
            ),
            duration
        ));

        iter = incIter(iter, iterMax);
        if (iter[0] === 0) {
            ++bankTime;
        }
    }

    return robberyTimes;
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
    var robberyTimes = [];

    if (isCorrectSchedule(schedule)) {
        var timezone = getTimezone(workingHours.from);

        robberyTimes = getRobberyTimes(
            convertSchedule(schedule, timezone),
            duration,
            convertWorkingHours(workingHours, timezone)
        );
    }

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            console.info(robberyTimes);
            if (robberyTimes.length !== 0) {
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
            var time = robberyTimes[0][0];
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
            robberyTimes.shift();
            if (robberyTimes && robberyTimes.length !== 0) {
                return true;
            }

            return false;
        }
    };
};
