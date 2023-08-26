# Dynamic pivoting with POSTGRESQL, MIKRO_ORM AND NODE.JS

## How I solved complex issue of dynamic pivoting with Postgresql

### why? : imagine you have a normalised data sets and you have a need to display fragment of the dataset in matrix (pivot table) view

### what is the problem?

- you don't know the columns names / number of colums in advance
- you need to use pagination, sorting and filtering

#### normalised dataset shape:

`id?: number;
salesDate: Date;
salesAmount: number;
productId: number;
productCategory: number;
customerId: number;`

which translates to db table fields: `id | sales_date | sales_amount | product_id | product_category | customer_id`

#### imagine you want to display sales by customer and product category

which translates to db table fields: `customer_id | category_1 | category_2 ..... | category_n`
        


    

