import type { NLocale } from './enUS'

const ukUA: NLocale = {
  name: 'uk-UA',
  global: {
    undo: 'Відмінити',
    redo: 'Повторити',
    confirm: 'Підтвердити'
  },
  Popconfirm: {
    positiveText: 'Підтвердити',
    negativeText: 'Скасувати'
  },
  Cascader: {
    placeholder: 'Обрати',
    loading: 'Завантаження',
    loadingRequiredMessage: (label: string): string =>
      `Завантажте всі дочірні вузли ${label} перед перевіркою`
  },
  Time: {
    dateFormat: 'yyyy-MM-dd',
    dateTimeFormat: 'yyyy-MM-dd HH:mm:ss'
  },
  DatePicker: {
    yearFormat: 'yyyy',
    monthFormat: 'MMM',
    dayFormat: 'eeeeee',
    yearTypeFormat: 'yyyy',
    monthTypeFormat: 'yyyy-MM',
    dateFormat: 'yyyy-MM-dd',
    dateTimeFormat: 'yyyy-MM-dd HH:mm:ss',
    quarterFormat: 'yyyy-qqq',
    clear: 'Стерти',
    now: 'Зараз',
    confirm: 'Підтвердити',
    selectTime: 'Обрати час',
    selectDate: 'Обрати дату',
    datePlaceholder: 'Обрати дату',
    datetimePlaceholder: 'Обрати дату і час',
    monthPlaceholder: 'Виберіть місяць',
    // FIXME: translation needed
    yearPlaceholder: 'Select Year',
    quarterPlaceholder: 'Select Quarter',
    startDatePlaceholder: 'Дата початку',
    endDatePlaceholder: 'Дата завершення',
    startDatetimePlaceholder: 'Дата і час початку',
    endDatetimePlaceholder: 'Дата і час завершення',
    monthBeforeYear: true,
    firstDayOfWeek: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    today: 'Сьогодні'
  },
  DataTable: {
    checkTableAll: 'Обрати все в таблиці',
    uncheckTableAll: 'Скасувати вибріу усього в таблиці',
    confirm: 'Підтвердити',
    clear: 'Стерти'
  },
  Transfer: {
    sourceTitle: 'Джерело',
    targetTitle: 'Ціль'
  },
  Empty: {
    description: 'Немає даних'
  },
  Select: {
    placeholder: 'Обрати'
  },
  TimePicker: {
    placeholder: 'Обрати час',
    positiveText: 'OK',
    negativeText: 'Скасувати',
    now: 'Зараз'
  },
  Pagination: {
    goto: 'Перейти',
    selectionSuffix: 'сторінка'
  },
  DynamicTags: {
    add: 'Додати'
  },
  Log: {
    loading: 'Завантаження'
  },
  Input: {
    placeholder: 'Ввести'
  },
  InputNumber: {
    placeholder: 'Ввести'
  },
  DynamicInput: {
    create: 'Створити'
  },
  ThemeEditor: {
    title: 'Редактор теми',
    clearAllVars: 'Стерти все',
    clearSearch: 'Очистити пошук',
    filterCompName: 'Фільтрувати за іменем компонента',
    filterVarName: 'Фільтрувати імена змінних',
    import: 'Імпорт',
    export: 'Експорт',
    restore: 'Скинути'
  }
}

export default ukUA
