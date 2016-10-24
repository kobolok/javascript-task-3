'use strict';

var DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
var BANK_DAYS = 3;
var MINUTE = 1;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var DAY_START = 0;
var DAY_END = 3 * DAY - MINUTE;
var HALF_HOUR = MINUTE * 30;


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
        var time = [start, item[0]];
        start = item[1];

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
                    return i[0] < j[0] ? -1 : 1;
                });
            newSchedule.push(getTimeInterval(persSchedule));
        }
    }

    return newSchedule;
}

function incIter(iter, iterMax) {
    var incFirst = true;
    for (var i = iter.length - 1; i > 0; --i) {
        if (++iter[i] === iterMax[i]) {
            iter[i] = 0;
        }
        else {
            incFirst = false;
            break;
        }
    }

    if (incFirst) {
        ++iter[0];
    }

    return iter;
}

function getRobberyInterval(start, finish, duration) {
    var robberyInterval = [];

    while (start + duration <= finish) {
        robberyInterval.push([start, start + duration]);
        start += HALF_HOUR;
    }

    return robberyInterval;
}

function getMinMax(fullSchedule, iter) {
    var result = [
        fullSchedule[0][iter[0]][0],
        fullSchedule[0][iter[0]][1]
    ];

    for (var i = 1; i < fullSchedule.length; ++i) {
        result[0] = Math.max(result[0], fullSchedule[i][iter[i]][0]);
        result[1] = Math.min(result[1], fullSchedule[i][iter[i]][1]);
    }

    return result;
}

function getIters(iter, iterMax, fullSchedule) {
    for (var i = 0; i < fullSchedule.length; ++i) {
        iter.push(0);
        iterMax.push(fullSchedule[i].length);
    }
}

function getRobberyTimes(fullSchedule, duration) {
    var robberyTimes = [];
    var iter = [];
    var iterMax = [];

    getIters(iter, iterMax, fullSchedule);

    while (iter[0] < iterMax[0]) {
        var minMax = getMinMax(fullSchedule, iter);
        robberyTimes = robberyTimes.concat(getRobberyInterval(
            minMax[0],
            minMax[1],
            duration
        ));

        iter = incIter(iter, iterMax);
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
exports.getAppropriateMoment = function sad(schedule, duration, workingHours) {
    var robberyTimes = [];

    var timezone = getTimezone(workingHours.from);
    var fullSchedule = [convertWorkingHours(workingHours, timezone)];
    fullSchedule = fullSchedule.concat(convertSchedule(schedule, timezone));

    robberyTimes = getRobberyTimes(fullSchedule, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
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
            if (robberyTimes.length === 0 || !template) {
                return '';
            }

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
            if (robberyTimes.length > 1) {
                robberyTimes.shift();

                return true;
            }

            return false;
        }
    };
};
