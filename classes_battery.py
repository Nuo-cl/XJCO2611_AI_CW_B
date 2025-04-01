from bbSearch import SearchProblem, search
from copy import deepcopy
import json

items = json.load(open("./config.json"))["items"]
ITEM_WEIGHT = [i["weight"] for i in items]
ITEM_NAME = [i["name"] for i in items]

class Robot:
    def __init__(self, location, carried_items, strength):
        self.location      = location
        self.carried_items = carried_items
        self.strength      = strength

    def weight_carried(self):
        return sum([ITEM_WEIGHT[i] for i in self.carried_items])

    ## Define unique string representation for the state of the robot object
    def __repr__(self):
        return str( ( self.location,
                      ", ".join(ITEM_NAME[i] for i in self.carried_items ),
                      self.strength ) )


class Door:
    def __init__(self, roomA, roomB, doorkey=None, locked=False):
        self.goes_between = {roomA, roomB}
        self.doorkey      = doorkey
        self.locked       = locked
        # Define handy dictionary to get room on other side of a door
        self.other_loc = {roomA:roomB, roomB:roomA}

    ## Define a unique string representation for a door object
    def __repr__(self):
        return str( ("door", self.goes_between, ITEM_NAME[self.doorkey] if self.doorkey != None else None, self.locked) )
    

class State:
    def __init__( self, robot, doors, room_contents ):
        self.robot = robot
        self.doors = doors
        self.room_contents = room_contents

    ## Define a string representation that will be uniquely identify the state.
    ## An easy way is to form a tuple of representations of the components of
    ## the state, then form a string from that:
    def __repr__(self):
        return str( ( self.robot.__repr__(),
                      [d.__repr__() for d in self.doors],
                    dict(zip(self.room_contents.keys(), [("None" if len(self.room_contents[rk])==0 else {ITEM_NAME[v] for v in self.room_contents[rk]}) for rk in self.room_contents.keys()])),
                    ))
    

class RobotWorker( SearchProblem ):

    def __init__( self, state, goal_item_locations ):
        self.initial_state = state
        self.goal_item_locations = goal_item_locations

    def possible_actions( self, state ):

        robot_location = state.robot.location
        strength       = state.robot.strength
        weight_carried = state.robot.weight_carried()

        actions = []
        # Can put down any carried item
        for i in state.robot.carried_items:
            # 特殊处理电池：放下电池会减少10点strength
            if ITEM_NAME[i] == "Battery":
                # 确保放下电池后strength减10再减0.1后仍足够支撑剩余物品
                if strength - 10 - 0.1 >= weight_carried - ITEM_WEIGHT[i]:
                    actions.append( ("put down", i) )
            else:
                if strength - 0.1 >= weight_carried - ITEM_WEIGHT[i]:
                    actions.append( ("put down", i) )

        # Can pick up any item in room if strong enough
        for i in state.room_contents[robot_location]:
            # 特殊处理电池：拾取电池会增加10点strength
            if ITEM_NAME[i] == "Battery":
                # 拾取电池后，strength会增加10再减0.1，所以条件更宽松
                if strength + 10 - 0.1 >= weight_carried + ITEM_WEIGHT[i]:
                    actions.append( ("pick up", i))
            else:
                if strength - 0.1 >= weight_carried + ITEM_WEIGHT[i]:
                    actions.append( ("pick up", i))

        # If there is an unlocked door between robot location and
        # another location can move to that location
        for door in state.doors:
            # 确保执行移动动作后，机器人的strength仍然足以支撑其携带的物品重量
            if strength - 0.1 >= weight_carried:
                if door.locked==False and robot_location in door.goes_between:
                    actions.append( ("move to", door.other_loc[robot_location]) )
                # If the door is locked, check if the robot has the key
                if door.locked==True and robot_location in door.goes_between:
                    if door.doorkey in state.robot.carried_items:
                        # If the robot has the key, it can move through the door
                        actions.append( ("move to", door.other_loc[robot_location]) )

        # Now the actions list should contain all possible actions
        return actions

    def successor( self, state, action):
        next_state = deepcopy(state)
        act, target = action
        if act== "put down":
            next_state.robot.carried_items.remove(target)
            next_state.room_contents[state.robot.location].add(target)
            # 如果是电池，放下后降低strength
            if ITEM_NAME[target] == "Battery":
                next_state.robot.strength -= 10  # 放下电池后降低10点strength

        if act == "pick up":
            next_state.robot.carried_items.append(target)
            next_state.room_contents[state.robot.location].remove(target)
            # 如果是电池，拾取后增加strength
            if ITEM_NAME[target] == "Battery":
                next_state.robot.strength += 10  # 拾取电池后增加10点strength

        if act == "move to":
            robot_location = state.robot.location
            for door in next_state.doors:
                if robot_location in door.goes_between and target in door.goes_between:
                    if door.locked == True:
                        door.locked = False
        
            next_state.robot.location = target

        # 每次执行动作后减少 strength
        next_state.robot.strength -= 0.1

        return next_state

    def goal_test(self, state):
        #print(state.room_contents)
        for room, contents in self.goal_item_locations.items():
            for i in contents:
                if not i in state.room_contents[room]:
                    return False
        return True

    def display_state(self,state):
        print("Robot location:", state.robot.location)
        print("Robot carrying:", state.robot.carried_items)
        print("Room contents:", state.room_contents)


