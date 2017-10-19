'use strict';

var moment = require('moment');
var StringMask = require('string-mask');

function isISODateString(date) {
	return /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}([-+][0-9]{2}:[0-9]{2}|Z)$/
		.test(date.toString());
}

function DateMaskDirective($locale) {
	var dateFormatMapByLocale = {
		'pt-br': 'DD/MM/YYYY',
		'ru': 'DD.MM.YYYY'
	};

	var defaultDateFormat = dateFormatMapByLocale[$locale.id] || 'YYYY-MM-DD';

	var setCaretPosition = function (el, caretPos) {
		el.value = el.value;
		if (el !== null) {
			if (el.createTextRange) {
				var range = el.createTextRange();
				range.move('character', caretPos);
				range.select();
			} else {
				if (el.selectionStart || el.selectionStart === 0) {
					el.focus();
					el.setSelectionRange(caretPos, caretPos);
				} else {
					el.focus();
				}
			}
		}
	};

	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, element, attrs, ctrl) {
			attrs.parse = attrs.parse || 'true';

			var dateFormat = attrs.uiDateMask || defaultDateFormat;

			var dateMask = new StringMask(dateFormat.replace(/[YMD]/g,'0'));

			function formatter(value) {
				if (ctrl.$isEmpty(value)) {
					return null;
				}

				var cleanValue = value;
				if (typeof value === 'object' || isISODateString(value)) {
					cleanValue = moment(value).format(dateFormat);
				}

				cleanValue = cleanValue.replace(/[^0-9]/g, '');
				var formatedValue = dateMask.apply(cleanValue) || '';

				return formatedValue.trim().replace(/[^0-9]$/, '');
			}

			ctrl.$formatters.push(formatter);

			ctrl.$parsers.push(function parser(value) {
				if (ctrl.$isEmpty(value)) {
					return value;
				}

				var formatedValue = formatter(value);

				if (ctrl.$viewValue !== formatedValue) {
					ctrl.$setViewValue(formatedValue);
					ctrl.$render();
					setTimeout(function () { 
						setCaretPosition(element[0], formatedValue.length)
					}, 0);
				}
				
				return attrs.parse === 'false'
					? formatedValue
					: moment(formatedValue, dateFormat).toDate();
			});

			ctrl.$validators.date =	function validator(modelValue, viewValue) {
				if (ctrl.$isEmpty(modelValue)) {
					return true;
				}

				return moment(viewValue, dateFormat).isValid() && viewValue.length === dateFormat.length;
			};
		}
	};
}
DateMaskDirective.$inject = ['$locale'];

module.exports = DateMaskDirective;
