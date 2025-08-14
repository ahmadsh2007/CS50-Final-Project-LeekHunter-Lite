#include <stdio.h>

float calculatePrice(float price, float discount) {
    return price - discount;
}

int main() {
    float price = 100.0;
    float discount = 0.2; // 20%
    printf("Final price: %.2f\n", calculatePrice(price, discount));
    return 0;
}
