#include <stdlib.h>

int main() {
    int *arr = malloc(10 * sizeof(int));
    arr[0] = 5;
    return 0;
}
