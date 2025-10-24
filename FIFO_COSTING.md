# FIFO Costing Implementation

## Overview

Implemented FIFO (First In, First Out) costing method for inventory and sales calculations.

## Changes

### Before (Broken)

- Stored only the latest `purchaseCost` on the `Product` entity
- Every time a purchase was made, it overwrote the previous cost
- When selling, it used the latest cost even if stock came from older purchases
- **Result:** Inaccurate profit calculations when product costs varied over time

**Example:**

```
Purchase 1: 100 units @ $200
Purchase 2: 50 units @ $400
Product.purchaseCost = $400  (overwritten)

Sell 120 units @ $300
- Cost used: $400 × 120 = $48,000  ❌ WRONG
- Revenue: $300 × 120 = $36,000
- Loss: $12,000 (should be profit!)
```

### After (FIFO)

- Keep all historical costs in `InventoryMovement` records with timestamps
- When selling, calculate cost using FIFO:
  1. Get all incoming movements (PURCHASE, ADJUST with qty > 0) ordered by date
  2. Get all outgoing movements (SALE, ADJUST with qty < 0) ordered by date
  3. Calculate which stock remains available per cost layer
  4. Assign units to remove from oldest cost layer first
  5. Use weighted average cost for the sale transaction

**Example (Same scenario):**

```
Purchase 1: 100 units @ $200 (created 2 weeks ago)
Purchase 2: 50 units @ $400 (created today)

Sell 120 units @ $300
- FIFO breakdown:
  * 100 units @ $200 = $20,000
  * 20 units @ $400 = $8,000
  * Weighted avg cost: $28,000 / 120 = $233.33

- Revenue: $300 × 120 = $36,000
- COGS: $28,000
- Profit: $8,000 ✅ CORRECT
```

## Implementation Details

### Modified Files

1. **inventory.service.ts**
   - `purchase()`: No longer updates `Product.purchaseCost`
   - `calculateFIFOCost(productId, qty)`: NEW method that returns FIFO cost breakdown

2. **sales.service.ts**
   - Injects `InventoryService`
   - `create()`: Now calls `calculateFIFOCost()` for each item
   - Creates separate `InventoryMovement` records per FIFO layer
   - Stores weighted average cost in `SaleItem.unitCostSnapshot`

### Database Schema

- No changes needed (schema already supports this)
- `InventoryMovement.unitCost` stores cost per unit
- `SaleItem.unitCostSnapshot` stores weighted average cost for reporting

## Business Impact

### Benefits

✅ Accurate profit/loss reporting when product costs change
✅ Compliant with standard accounting practices (FIFO)
✅ Historical cost tracking per batch
✅ Can generate cost of goods sold (COGS) reports accurately

### Example Scenarios

**Scenario 1: Increasing costs**

- Buy Widget at $10 (100 units)
- Buy Widget at $20 (50 units)
- Sell Widget at $15 (120 units)
- Profit = ($15 × 120) - ($10 × 100 + $20 × 20) = $1,800 - $1,400 = **$400**

**Scenario 2: Seasonal inventory**

- Expensive item bought 6 months ago still in stock
- Cheaper version available today
- Old expensive stock sells first (FIFO)
- Accurate margin calculation

## Testing

Run sales and verify:

1. Sell items when multiple purchase prices exist
2. Check `SaleItem.unitCostSnapshot` matches weighted average
3. Verify dashboard COGS calculation is accurate
4. Check `InventoryMovement` records show cost per unit

## Future Enhancements

- Add LIFO (Last In, First Out) option
- Add Weighted Average option
- Add cost layer visibility in UI
- Generate FIFO cost layer reports
