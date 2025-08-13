#include <stdio.h>

int main() {
    int sum = 0;
    // Bug: loop off by one, should be i <= 5
    for (int i = 0; i < 5; i++) {
        sum += i;
    }
    printf("Sum: %d\n", sum); // Expected 15, prints 10
    return 0;
}
