
def cost(path, state):
    return len(path)

def cost_2(path, state):
    count = 0
    for action in path:
        if action[0] == 'move':
            count += 1
        else:
            count += 0.5
    return count
