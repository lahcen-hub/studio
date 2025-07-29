# **App Name**: CargoValuator

## Core Features:

- Empty Crates Weight Calculation: Calculate the total weight of empty crates based on the number of crates and the weight of each empty crate.
- Net Product Weight Calculation: Calculate the net weight of products by subtracting the total weight of empty crates from the gross weight.
- Average Net Weight per Crate: Calculate the average net weight per crate by dividing the total net product weight by the total number of crates.
- Net Weight by Product Type: Calculate the net weight of each product type by multiplying the number of crates for that type by the average net weight per crate.
- Virtual Crate Number Calculation: Calculate a 'virtual crate number' for each product type by dividing the net weight of the product type by the weight of a full crate.
- Total Price Calculation: Calculate the total price for each product type by multiplying the virtual crate number by the price per full crate.
- Summary Display: Display a clear summary table showing weights, coefficients, and prices for each product type, along with an overall total.

## Style Guidelines:

- Primary color: Light green (#B2D7B3) to represent calculation.
- Background color: Very light green (#F0F4F0) to ensure a calm appearance
- Accent color: Yellow (#D7C4B2) to highlight totals
- Font: 'Inter', a sans-serif font known for its readability, for both headlines and body text
- Use a tabular layout to present the calculated values, ensuring clear alignment and easy comparison between product types.
- Incorporate simple icons next to each data point in the summary table to visually represent the values (e.g., weight, quantity, price).