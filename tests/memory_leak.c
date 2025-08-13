#include <stdlib.h>

int main() {
    int *arr = malloc(10 * sizeof(int));
    // Bug: memory allocated but never freed
    arr[0] = 5;
    return 0;
}
