from bbSearch import search

from classes import *

DOORS = [
    Door('workshop', 'store room', locked=False),
    Door( 'store room', 'tool cupboard', doorkey=5, locked=True )
]

rob = Robot('store room', [], 15 )

state = State(rob, DOORS, ROOM_CONTENTS)

goal_item_locations =  {"store room":{1,2}}

RW_PROBLEM_1 = RobotWorker( state, goal_item_locations )

poss_acts = RW_PROBLEM_1.possible_actions( RW_PROBLEM_1.initial_state )

print(state.__repr__())