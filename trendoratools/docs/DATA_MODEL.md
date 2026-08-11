# Data Model

All records use stable IDs and timestamps.

## Preferences

- currency
- theme
- notifications
- onboarded

## Income

- id
- name
- amountMinor
- month `YYYY-MM`
- notes
- createdAt
- updatedAt

## Budget

- id
- name
- month `YYYY-MM`
- notes
- createdAt
- updatedAt

## Budget Category

- id
- budgetId
- name
- limitMinor
- createdAt
- updatedAt

## Expense

- id
- amountMinor
- category
- categoryId
- description
- date `YYYY-MM-DD`
- recurring
- createdAt
- updatedAt

## Savings Goal

- id
- name
- targetMinor
- targetDate
- notes
- createdAt
- updatedAt

## Savings Contribution

- id
- goalId

- amountMinor
- date
- note
- createdAt
- updatedAt
