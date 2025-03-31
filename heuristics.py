import numpy as np

def misplaced(state, goal):
    count = 0
    
    for room, items in goal.items():
        for item in items:
            if item not in state.room_contents[room]:
                count += 1
    return count

def make_misplaced(goal):
    def misplaced_with_goal(state):
        return misplaced(state, goal)
    return misplaced_with_goal

def find_key(dict, value):
    for k, v in dict.items():
        if value in v:
            return k

def carry_right_items(state, goal):
    count = 0
    items = set().union(*state.room_contents.values())
    goal_items = set().union(*goal.values())
    carried_items = state.robot.carried_items
    
    for item in items:
        if item not in goal_items:
            if item in carried_items:
                count += 1
        else:
            if item not in carried_items:
                if find_key(goal, item) != find_key(state.room_contents, item):
                    count += 1
    return count

def make_carry_right_items(goal):
    def carry_right_items_with_goal(state):
        return carry_right_items(state, goal)
    return carry_right_items_with_goal

def locked_doors(state, goal=None):
    count = 0
    carried_items = state.robot.carried_items
    for door in state.doors:
        if door.doorkey != None and door.doorkey not in carried_items:
            count += 1
    return count

def misplaced_locked(state, goal):
    misplaced_count = misplaced(state, goal)
    locked_doors_count = locked_doors(state)
    return misplaced_count + locked_doors_count

def make_misplaced_locked(goal):
    def misplaced_locked_with_goal(state):
        return misplaced_locked(state, goal)
    return misplaced_locked_with_goal

def carry_locked(state, goal):
    carry_count = carry_right_items(state, goal)
    locked_count = locked_doors(state)
    return carry_count + 2 *locked_count

def make_carry_locked(goal):
    def carry_locked_with_goal(state):
        return carry_locked(state, goal)
    return carry_locked_with_goal
