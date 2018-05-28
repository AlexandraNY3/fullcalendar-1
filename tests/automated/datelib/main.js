import { formatPrettyTimeZoneOffset, formatIsoTimeZoneOffset } from './utils'

describe('datelib', function() {
  var DateEnv = FullCalendar.DateEnv
  var createFormatter = FullCalendar.createFormatter
  var createDuration = FullCalendar.createDuration
  var getLocale = FullCalendar.getLocale
  var startOfDay = FullCalendar.startOfDay
  var diffWholeWeeks = FullCalendar.diffWholeWeeks
  var diffWholeDays = FullCalendar.diffWholeDays
  var diffDayAndTime = FullCalendar.diffDayAndTime

  describe('computeWeekNumber', function() {

    it('works with local', function() {
      var env = new DateEnv({
        timeZone: 'UTC',
        calendarSystem: 'gregory',
        locale: getLocale('en')
      })
      var m1 = env.createMarker('2018-04-07')
      var m2 = env.createMarker('2018-04-08')
      expect(env.computeWeekNumber(m1)).toBe(14)
      expect(env.computeWeekNumber(m2)).toBe(15)
    })

    it('works with ISO', function() {
      var env = new DateEnv({
        timeZone: 'UTC',
        calendarSystem: 'gregory',
        locale: getLocale('en'),
        weekNumberCalculation: 'ISO'
      })
      var m1 = env.createMarker('2018-04-01')
      var m2 = env.createMarker('2018-04-02')
      expect(env.computeWeekNumber(m1)).toBe(13)
      expect(env.computeWeekNumber(m2)).toBe(14)
    })

    it('works with custom function', function() {
      var env = new DateEnv({
        timeZone: 'UTC',
        calendarSystem: 'gregory',
        locale: getLocale('en'),
        weekNumberCalculation: function(date) {
          expect(date instanceof Date).toBe(true)
          expect(date.valueOf()).toBe(Date.UTC(2018, 3, 1))
          return 99
        }
      })
      var m1 = env.createMarker('2018-04-01')
      expect(env.computeWeekNumber(m1)).toBe(99)
    })

  })

  it('startOfWeek with different firstDay', function() {
    var env = new DateEnv({
      timeZone: 'UTC',
      calendarSystem: 'gregory',
      locale: getLocale('en'),
      firstDay: 2 // tues
    })
    var m = env.createMarker('2018-04-19')
    var w = env.startOfWeek(m)

    expect(env.toDate(w)).toEqual(
      new Date(Date.UTC(2018, 3, 17))
    )
  })


  describe('when UTC', function() {
    var env

    beforeEach(function() {
      env = new DateEnv({
        timeZone: 'UTC',
        calendarSystem: 'gregory',
        locale: getLocale('en')
      })
    })

    describe('createMarker', function() {

      it('with date', function() {
        expect(
          env.toDate(
            env.createMarker(
              new Date(2017, 5, 8)
            )
          )
        ).toEqual(
          new Date(2017, 5, 8)
        )
      })

      it('with timestamp', function() {
        expect(
          env.toDate(
            env.createMarker(
              new Date(2017, 5, 8).valueOf()
            )
          )
        ).toEqual(
          new Date(2017, 5, 8)
        )
      })

      it('with array', function() {
        expect(
          env.toDate(
            env.createMarker(
              [ 2017, 5, 8 ]
            )
          )
        ).toEqual(
          new Date(Date.UTC(2017, 5, 8))
        )
      })

    })

    describe('ISO8601 parsing', function() {

      it('parses non-tz as UTC', function() {
        var res = env.createMarkerMeta('2018-06-08')
        var date = env.toDate(res.marker)
        expect(date).toEqual(new Date(Date.UTC(2018, 5, 8)))
        expect(res.forcedTimeZoneOffset).toBeNull()
      })

      it('parses a date already in UTC', function() {
        var res = env.createMarkerMeta('2018-06-08T00:00:00Z')
        var date = env.toDate(res.marker)
        expect(date).toEqual(new Date(Date.UTC(2018, 5, 8)))
        expect(res.forcedTimeZoneOffset).toBeNull()
      })

      it('parses timezones into UTC', function() {
        var res = env.createMarkerMeta('2018-06-08T00:00:00+12:00')
        var date = env.toDate(res.marker)
        expect(date).toEqual(new Date(Date.UTC(2018, 5, 7, 12)))
        expect(res.forcedTimeZoneOffset).toBeNull()
      })

      it('detects lack of time', function() {
        var res = env.createMarkerMeta('2018-06-08')
        expect(res.isTimeUnspecified).toBe(true)
      })

      it('detects presence of time', function() {
        var res = env.createMarkerMeta('2018-06-08T00:00:00')
        expect(res.isTimeUnspecified).toBe(false)
      })

      it('detects presence of time even if timezone', function() {
        var res = env.createMarkerMeta('2018-06-08T00:00:00+12:00')
        expect(res.isTimeUnspecified).toBe(false)
      })

    })

    it('outputs ISO8601 formatting', function() {
      var marker = env.createMarker('2018-06-08T00:00:00')
      var s = env.formatIso(marker)
      expect(s).toBe('2018-06-08T00:00:00Z')
    })

    it('outputs pretty format with UTC timezone', function() {
      var marker = env.createMarker('2018-06-08')
      var formatter = createFormatter({
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZoneName: 'short'
      })
      var s = env.format(marker, formatter)
      expect(s).toBe('Friday, June 8, 2018, UTC')
    })


    describe('week number formatting', function() {

      it('can output only number', function() {
        var marker = env.createMarker('2018-06-08')
        var formatter = createFormatter({ week: 'numeric' })
        var s = env.format(marker, formatter)
        expect(s).toBe('23')
      })

      it('can output narrow', function() {
        var marker = env.createMarker('2018-06-08')
        var formatter = createFormatter({ week: 'narrow' })
        var s = env.format(marker, formatter)
        expect(s).toBe('Wk23')
      })

      it('can output short', function() {
        var marker = env.createMarker('2018-06-08')
        var formatter = createFormatter({ week: 'short' })
        var s = env.format(marker, formatter)
        expect(s).toBe('Wk 23')
      })
    })


    describe('range formatting', function() {
      var formatter = createFormatter({
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })

      it('works with different days of same month', function() {
        var m0 = env.createMarker('2018-06-08')
        var m1 = env.createMarker('2018-06-09')
        var s = env.formatRange(m0, m1, formatter)
        expect(s).toBe('June 8 - 9, 2018')
      })

      it('works with different days of same month, with inprecise formatter', function() {
        var formatter = createFormatter({
          month: 'long',
          year: 'numeric'
        })
        var m0 = env.createMarker('2018-06-08')
        var m1 = env.createMarker('2018-06-09')
        var s = env.formatRange(m0, m1, formatter)
        expect(s).toBe('June 2018')
      })

      it('works with different day/month of same year', function() {
        var m0 = env.createMarker('2018-06-08')
        var m1 = env.createMarker('2018-07-09')
        var s = env.formatRange(m0, m1, formatter)
        expect(s).toBe('June 8 - July 9, 2018')
      })

      it('works with completely different dates', function() {
        var m0 = env.createMarker('2018-06-08')
        var m1 = env.createMarker('2020-07-09')
        var s = env.formatRange(m0, m1, formatter)
        expect(s).toBe('June 8, 2018 - July 9, 2020')
      })

    })


    // date math

    describe('add', function() {

      it('works with positives', function() {
        var dur = createDuration({
          year: 1,
          month: 2,
          day: 3,
          hour: 4,
          minute: 5,
          second: 6,
          ms: 7
        })
        var d0 = env.createMarker(new Date(Date.UTC(2018, 5, 5, 12)))
        var d1 = env.toDate(env.add(d0, dur))
        expect(d1).toEqual(
          new Date(Date.UTC(2019, 7, 8, 16, 5, 6, 7))
        )
      })

      it('works with negatives', function() {
        var dur = createDuration({
          year: -1,
          month: -2,
          day: -3,
          hour: -4,
          minute: -5,
          second: -6,
          millisecond: -7
        })
        var d0 = env.createMarker(new Date(Date.UTC(2018, 5, 5, 12)))
        var d1 = env.toDate(env.add(d0, dur))
        expect(d1).toEqual(
          new Date(Date.UTC(2017, 3, 2, 7, 54, 53, 993))
        )
      })

    })

    it('startOfYear', function() {
      var d0 = env.createMarker(new Date(Date.UTC(2018, 5, 5, 12)))
      var d1 = env.toDate(env.startOfYear(d0))
      expect(d1).toEqual(
        new Date(Date.UTC(2018, 0, 1))
      )
    })

    it('startOfMonth', function() {
      var d0 = env.createMarker(new Date(Date.UTC(2018, 5, 5, 12)))
      var d1 = env.toDate(env.startOfMonth(d0))
      expect(d1).toEqual(
        new Date(Date.UTC(2018, 5, 1))
      )
    })

    it('startOfWeek', function() {
      var d0 = env.createMarker(new Date(Date.UTC(2018, 5, 5, 12)))
      var d1 = env.toDate(env.startOfWeek(d0))
      expect(d1).toEqual(
        new Date(Date.UTC(2018, 5, 3))
      )
    })

    it('startOfDay', function() {
      var d0 = env.createMarker(new Date(Date.UTC(2018, 5, 5, 12, 30)))
      var d1 = env.toDate(startOfDay(d0))
      expect(d1).toEqual(
        new Date(Date.UTC(2018, 5, 5))
      )
    })

    describe('diffWholeYears', function() {

      it('returns null if not whole', function() {
        var d0 = new Date(Date.UTC(2018, 5, 5, 12, 0))
        var d1 = new Date(Date.UTC(2020, 5, 5, 12, 30))
        var diff = env.diffWholeYears(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(null)
      })

      it('returns negative', function() {
        var d0 = new Date(Date.UTC(2020, 5, 5, 12, 0))
        var d1 = new Date(Date.UTC(2018, 5, 5, 12, 0))
        var diff = env.diffWholeYears(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(-2)
      })

      it('returns positive', function() {
        var d0 = new Date(Date.UTC(2018, 5, 5, 12, 0))
        var d1 = new Date(Date.UTC(2020, 5, 5, 12, 0))
        var diff = env.diffWholeYears(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(2)
      })

    })

    describe('diffWholeMonths', function() {

      it('returns null if not whole', function() {
        var d0 = new Date(Date.UTC(2018, 5, 5))
        var d1 = new Date(Date.UTC(2020, 5, 6))
        var diff = env.diffWholeMonths(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(null)
      })

      it('returns negative', function() {
        var d0 = new Date(Date.UTC(2020, 9, 5))
        var d1 = new Date(Date.UTC(2018, 5, 5))
        var diff = env.diffWholeMonths(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(-12 * 2 - 4)
      })

      it('returns positive', function() {
        var d0 = new Date(Date.UTC(2018, 5, 5))
        var d1 = new Date(Date.UTC(2020, 9, 5))
        var diff = env.diffWholeMonths(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(12 * 2 + 4)
      })

    })

    describe('diffWholeWeeks', function() {

      it('returns null if not whole', function() {
        var d0 = new Date(Date.UTC(2018, 5, 5))
        var d1 = new Date(Date.UTC(2018, 5, 20))
        var diff = diffWholeWeeks(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(null)
      })

      it('returns negative', function() {
        var d0 = new Date(Date.UTC(2018, 5, 19))
        var d1 = new Date(Date.UTC(2018, 5, 5))
        var diff = diffWholeWeeks(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(-2)
      })

      it('returns positive', function() {
        var d0 = new Date(Date.UTC(2018, 5, 5))
        var d1 = new Date(Date.UTC(2018, 5, 19))
        var diff = diffWholeWeeks(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(2)
      })

    })

    describe('diffWholeDays', function() {

      it('returns null if not whole', function() {
        var d0 = new Date(Date.UTC(2018, 5, 5))
        var d1 = new Date(Date.UTC(2018, 5, 19, 12))
        var diff = diffWholeDays(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(null)
      })

      it('returns negative', function() {
        var d0 = new Date(Date.UTC(2018, 5, 19))
        var d1 = new Date(Date.UTC(2018, 5, 5))
        var diff = diffWholeDays(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(-14)
      })

      it('returns positive', function() {
        var d0 = new Date(Date.UTC(2018, 5, 5))
        var d1 = new Date(Date.UTC(2018, 5, 19))
        var diff = diffWholeDays(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toBe(14)
      })

    })

    describe('diffDayAndTime', function() {

      it('returns negative', function() {
        var d0 = new Date(Date.UTC(2018, 5, 19, 12))
        var d1 = new Date(Date.UTC(2018, 5, 5))
        var diff = diffDayAndTime(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toEqual({
          year: 0,
          month: 0,
          day: -14,
          time: -12 * 60 * 60 * 1000
        })
      })

      it('returns positive', function() {
        var d0 = new Date(Date.UTC(2018, 5, 5))
        var d1 = new Date(Date.UTC(2018, 5, 19, 12))
        var diff = diffDayAndTime(
          env.createMarker(d0),
          env.createMarker(d1)
        )
        expect(diff).toEqual({
          year: 0,
          month: 0,
          day: 14,
          time: 12 * 60 * 60 * 1000
        })
      })

    })

  })

  describe('when local', function() {
    var env

    beforeEach(function() {
      env = new DateEnv({
        timeZone: 'local',
        calendarSystem: 'gregory',
        locale: getLocale('en')
      })
    })

    describe('ISO8601 parsing', function() {

      it('parses non-tz as local', function() {
        var res = env.createMarkerMeta('2018-06-08')
        var date = env.toDate(res.marker)
        expect(date).toEqual(new Date(2018, 5, 8))
        expect(res.forcedTimeZoneOffset).toBeNull()
      })

      it('parses timezones into local', function() {
        var res = env.createMarkerMeta('2018-06-08T00:00:00+12:00')
        var date = env.toDate(res.marker)
        expect(date).toEqual(new Date(Date.UTC(2018, 5, 7, 12)))
        expect(res.forcedTimeZoneOffset).toBeNull()
      })

    })

    it('outputs ISO8601 formatting', function() {
      var marker = env.createMarker('2018-06-08T00:00:00')
      var s = env.formatIso(marker)
      var realTzo = formatIsoTimeZoneOffset(new Date(2018, 5, 8))
      expect(s).toBe('2018-06-08T00:00:00' + realTzo)
    })

    it('outputs pretty format with local timezone', function() {
      var marker = env.createMarker('2018-06-08')
      var formatter = createFormatter({
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZoneName: 'short'
      })
      var s = env.format(marker, formatter)
      expect(s).toBe('Friday, June 8, 2018, ' + formatPrettyTimeZoneOffset(new Date(2018, 5, 8)))
    })

    it('can output a timezone only', function() {
      var marker = env.createMarker('2018-06-08')
      var formatter = createFormatter({ timeZoneName: 'short' })
      var s = env.format(marker, formatter)
      expect(s).toBe(formatPrettyTimeZoneOffset(new Date(2018, 5, 8)))
    })


    // because `new Date(year)` is error-prone
    it('startOfYear', function() {
      var d0 = env.createMarker(new Date(2018, 5, 5, 12))
      var d1 = env.toDate(env.startOfYear(d0))
      expect(d1).toEqual(
        new Date(2018, 0, 1)
      )
    })

  })

  describe('when named timezone with coercion', function() {
    var env

    beforeEach(function() {
      env = new DateEnv({
        timeZone: 'America/Chicago',
        calendarSystem: 'gregory',
        locale: getLocale('en')
      })
    })

    describe('ISO8601 parsing', function() {

      it('parses non-tz as UTC with no forcedTimeZoneOffset', function() {
        var res = env.createMarkerMeta('2018-06-08')
        var date = env.toDate(res.marker)
        expect(date).toEqual(new Date(Date.UTC(2018, 5, 8)))
        expect(res.forcedTimeZoneOffset).toBeNull()
      })

      it('parses as UTC after stripping and with a forcedTimeZoneOffset', function() {
        var res = env.createMarkerMeta('2018-06-08T00:00:00+12:00')
        var date = env.toDate(res.marker)
        expect(date).toEqual(new Date(Date.UTC(2018, 5, 8)))
        expect(res.forcedTimeZoneOffset).toBe(12 * 60)
      })

    })

    it('outputs pretty format with no timezone even tho specified', function() {
      var marker = env.createMarker('2018-06-08')
      var formatter = createFormatter({
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZoneName: 'short'
      })
      var s = env.format(marker, formatter)
      expect(s).toBe('Friday, June 8, 2018')
    })

    it('outputs pretty format with no timezone even tho specified as long', function() {
      var marker = env.createMarker('2018-06-08')
      var formatter = createFormatter({
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZoneName: 'long'
      })
      var s = env.format(marker, formatter)
      expect(s).toBe('Friday, June 8, 2018')
    })

  })

  describe('duration parsing', function() {

    it('accepts whole day in string', function() {
      var dur = createDuration('2.00:00:00')
      expect(dur).toEqual({
        year: 0,
        month: 0,
        day: 2,
        time: 0
      })
    })

    it('accepts hours, minutes, seconds, and milliseconds', function() {
      var dur = createDuration('01:02:03.500')
      expect(dur).toEqual({
        year: 0,
        month: 0,
        day: 0,
        time:
          1 * 60 * 60 * 1000 +
          2 * 60 * 1000 +
          3 * 1000 +
          500
      })
    })

    it('accepts just hours and minutes', function() {
      var dur = createDuration('01:02')
      expect(dur).toEqual({
        year: 0,
        month: 0,
        day: 0,
        time:
          1 * 60 * 60 * 1000 +
          2 * 60 * 1000
      })
    })

  })

})