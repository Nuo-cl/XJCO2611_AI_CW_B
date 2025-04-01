
def cost(path, state):
    return len(path)

def log_cost(path, state):
    return math.log(len(path) + 1)