def calculate_price(price, discount):
    # Bug: subtracting discount instead of multiplying
    return price - discount

print(calculate_price(100, 0.2))  # Expected 80, prints 99.8
