import ast, operator as op

OPS = {ast.Add: op.add, ast.Sub: op.sub, ast.Mult: op.mul, ast.Div: op.truediv,
       ast.Mod: op.mod, ast.Pow: op.pow, ast.USub: op.neg, ast.UAdd: op.pos}

def eval_expr(node):
    if isinstance(node, ast.Num):  # For Python <= 3.7
        return node.n
    elif isinstance(node, ast.Constant):  # For Python >= 3.8
        if isinstance(node.value, (int, float)):
            return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in OPS:
        return OPS[type(node.op)](eval_expr(node.left), eval_expr(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in OPS:
        return OPS[type(node.op)](eval_expr(node.operand))
    raise ValueError("Invalid or unsupported expression")

def safe_calc():
    print("Simple Calculator (+, -, *, /, %, ^)\nType 'exit' to quit.")
    while True:
        try:
            expr = input("Enter expression: ").strip()
            if expr.lower() == "exit":
                break
            # Optional: keep parentheses count check for clearer error
            if expr.count('(') != expr.count(')'):
                print("Unmatched parentheses.")
                continue
            expr = expr.replace("^", "**")  # Standardize exponent
            result = eval_expr(ast.parse(expr, mode='eval').body)
            print(f"Result: {result}")
        except ZeroDivisionError:
            print("Division by zero is not allowed.")
        except SyntaxError:
            print("Syntax Error: Please check your expression.")
        except ValueError as e:
            print(f"Calculation Error: {e}")
        except RecursionError:
            print("Calculation Error: Expression is too deeply nested.")
        except Exception as e:
            print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    safe_calc()
