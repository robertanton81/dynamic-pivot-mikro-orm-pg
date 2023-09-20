import { IPivotValueFilters } from './types';

type IFilterOperator = 'notNull' | 'null' | 'equal' | 'notEqual' | 'like' | 'notLike' | 'in' | 'notIn' | 'between' | 'notBetween';

enum FilterOperators {
  equal = 'equal',
  notEqual = 'notEqual',
  like = 'like',
  notLike = 'notLike',
  in = 'in',
  notIn = 'notIn',
}

export interface IBaseFilter<T, V, K extends IFilterOperator> {
  fieldName: keyof T;
  operator: K;
  value: V;
}

export class BaseFilter<T, V, K extends IFilterOperator> implements IBaseFilter<T, V, K> {
  fieldName: keyof T;
  operator: K;
  value: V;

  constructor(fieldName: keyof T, operator: K, value: V) {
    this.fieldName = fieldName;
    this.operator = operator;
    this.value = value;
  }
}

type IEqualFilterValue = string | boolean | number | Date;

interface IEqualFilterArgs<T> {
  fieldName: keyof T;
  value: IEqualFilterValue;
}

export interface IEqualFilter<T> extends IBaseFilter<T, IEqualFilterValue, FilterOperators.equal> {}

export class EqualFilter<T extends string> extends BaseFilter<T, IEqualFilterValue, FilterOperators.equal> implements IEqualFilter<T> {
  constructor({ fieldName, value }: IEqualFilterArgs<T>) {
    super(fieldName, FilterOperators.equal, value);
  }
}

export interface INotEqualFilter<T> extends IBaseFilter<T, IEqualFilterValue, FilterOperators.notEqual> {}
export class NotEqualFilter<T extends string> extends BaseFilter<T, IEqualFilterValue, FilterOperators.notEqual> implements INotEqualFilter<T> {
  constructor({ fieldName, value }: IEqualFilterArgs<T>) {
    super(fieldName, FilterOperators.notEqual, value);
  }
}

interface ILikeFilterArgs<T> {
  fieldName: keyof T;
  value: string;
}

export interface ILikeFilter<T> extends IBaseFilter<T, string, FilterOperators.like> {}
export class LikeFilter<T extends string> extends BaseFilter<T, string, FilterOperators.like> implements ILikeFilter<T> {
  constructor({ fieldName, value }: ILikeFilterArgs<T>) {
    super(fieldName, FilterOperators.like, value);
  }
}

export interface INotLikeFilter<T> extends IBaseFilter<T, string, FilterOperators.notLike> {}
export class NotLikeFilter<T extends string> extends BaseFilter<T, string, FilterOperators.notLike> implements INotLikeFilter<T> {
  constructor({ fieldName, value }: ILikeFilterArgs<T>) {
    super(fieldName, FilterOperators.notLike, value);
  }
}

type IInFilterValue = (string | boolean | number | Date)[];
interface IInFilterArgs<T> {
  fieldName: keyof T;
  value: IInFilterValue;
}

export interface IInFilter<T> extends IBaseFilter<T, IInFilterValue, FilterOperators.in> {}
export class InFilter<T extends string> extends BaseFilter<T, IInFilterValue, FilterOperators.in> implements IInFilter<T> {
  constructor({ fieldName, value }: IInFilterArgs<T>) {
    super(fieldName, FilterOperators.in, value);
  }
}

export interface INotInFilter<T> extends IBaseFilter<T, IInFilterValue, FilterOperators.notIn> {}
export class NotInFilter<T extends string> extends BaseFilter<T, IInFilterValue, FilterOperators.notIn> implements INotInFilter<T> {
  constructor({ value, fieldName }: IInFilterArgs<T>) {
    super(fieldName, FilterOperators.notIn, value);
  }
}

class BookBuilder {
  name: string = '';
  author: string = '';
  category: string = '';
  price: number = 0;

  constructor() {}

  withName(name: string) {
    this.name = name;
    return this;
  }

  withAuthor(author: string) {
    this.author = author;
    return this;
  }

  withPrice(price: number) {
    this.price = price;
    return this;
  }

  withCategory(category: string) {
    this.category = category;
    return this;
  }

  build() {
    return {
      name: this.name,
      author: this.author,
      prices: this.price,
      category: this.category,
    };
  }
}

//Calling the builder class
const book = new BookBuilder().withName('The Reckonings').withAuthor('Lacy Johnson').withPrice(31).withCategory('Literature').build();

//
// export class LikeFilter<T extends string> extends BaseFilter<T, string> {
//   constructor({ fieldName, value }: { fieldName: keyof T; value: string }) {
//     super(fieldName, 'like', value);
//   }
// }
//
// export interface IInFilter<T> extends IBaseFilter<T> {
//   value: (string | number | Date)[];
//   operator: 'in' | 'notIn';
// }
//
// export interface IBetweenFilter<T> extends IBaseFilter<T> {
//   value: [Date, Date] | [number, number];
//   operator: 'between' | 'notBetween';
// }
//
// export type IFilter<T> = IBaseFilter<T> | IEqualFilter<T> | ILikeFilter<T> | IInFilter<T> | IBetweenFilter<T>;
//
// // #region filters
//
// export class NotNullFilter<T extends string> extends BaseFilter<T> implements IBaseFilter<T> {
//   constructor(fieldName: keyof T) {
//     super(fieldName, 'notNull');
//   }
// }
//
// export class NullFilter<T extends string> extends BaseFilter<T> implements IBaseFilter<T> {
//   constructor(fieldName: keyof T) {
//     super(fieldName, 'null');
//   }
// }
//
// export class NotEqualFilter<T extends string> extends BaseFilter<T> implements IEqualFilter<T> {
//   value: string | boolean | number | Date;
//   operator: 'notEqual';
//
//   constructor({ fieldName, value }: { fieldName: keyof T; value: string | boolean | number | Date }) {
//     super(fieldName);
//     this.value = value;
//     this.operator = 'notEqual';
//   }
// }
//
// export class NotLikeFilter extends BaseFilter<any> implements ILikeFilter<any> {
//   value: string;
//   operator: 'notLike';
//
//   constructor({ fieldName, value }: { fieldName: string; value: string }) {
//     super(fieldName);
//     this.value = value;
//     this.operator = 'notLike';
//   }
// }
//
// export class InFilter<T extends string> extends BaseFilter<T> implements IInFilter<T> {
//   value: (string | number | Date)[];
//   operator: 'in';
//
//   constructor({ fieldName, value }: { fieldName: keyof T; value: (string | number | Date)[] }) {
//     super(fieldName);
//     this.value = value;
//     this.operator = 'in';
//   }
// }
//
// export class NotInFilter<T extends string> extends BaseFilter<T> implements IInFilter<T> {
//   value: (string | number | Date)[];
//   operator: 'notIn';
//
//   constructor({ fieldName, value }: { fieldName: keyof T; value: (string | number | Date)[] }) {
//     super(fieldName);
//     this.value = value;
//     this.operator = 'notIn';
//   }
//
//   get filterSql() {
//     return `${this.fieldName} ${this.value}`;
//   }
// }
//
// export class BetweenFilter<T extends string> extends BaseFilter<T> implements IBetweenFilter<T> {
//   value: [Date, Date] | [number, number];
//   operator: 'between';
//
//   constructor({ fieldName, value }: { fieldName: keyof T; value: [Date, Date] | [number, number] }) {
//     super(fieldName);
//     this.value = value;
//     this.operator = 'between';
//   }
//
//   get filterSql() {
//     return `${this.fieldName} ${this.value}`;
//   }
// }
//
// // #endregion filters
//
// // #region filter typeGuards
// const isEqualFilterType = <T>(filter: IFilter<T>): filter is IEqualFilter<T> => filter instanceof EqualFilter;
// const isNotNullFilterType = <T>(filter: IFilter<T>): filter is INotNullFilter<T> => filter instanceof NotNullFilter;
// const isNullFilterType = <T>(filter: IFilter<T>): filter is INullFilter<T> => filter instanceof NullFilter;
// const isLikeFilterType = <T>(filter: IFilter<T>): filter is ILikeFilter<T> => filter instanceof LikeFilter;
// // #endregion filter typeGuards
//
// export const sanitizeFilters = (valueFilters: IPivotValueFilters) => {
//   const sqlInjectionMatcher = `^(?!.*\\-\\-)(?!.*\\/\\*)(?!.*\\*\\/)(?!.*;)(?!.*CREATE)(?!.*DROP)(?!.*ALTER)(?!.*FROM)(?!.*DATABASE)(?!.*TABLE)(?!.*SELECT)(?!.*UPDATE)(?!.*=)(?!.*TRUE)(?!.*DELETE).*$`;
//
//   return Object.values(valueFilters)
//     .map((filterValue) => String(filterValue).toUpperCase())
//     .map((value) => {
//       const sqlIsSafe = value.match(sqlInjectionMatcher);
//       if (!sqlIsSafe) throw new Error('Invalid SQL query arguments');
//
//       return sqlIsSafe;
//     });
// };
