import numpy as np
from classes_battery import ITEM_NAME

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
                if not ITEM_NAME[item].startswith("Key"):
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

def get_max_weight_in_goal(goal):
    max_weight = 0
    from classes import ITEM_WEIGHT
    for room, items in goal.items():
        for item in items:
            if ITEM_WEIGHT[item] > max_weight:
                max_weight = ITEM_WEIGHT[item]
    return max_weight

def battery_aware_misplaced(state, goal, max_weight_in_goal):
    # 统计位置错误的目标物品数量
    misplaced_count = misplaced(state, goal)
    
    # 检查机器人是否携带电池
    is_carrying_battery = False
    for item in state.robot.carried_items:
        if ITEM_NAME[item] == "Battery":
            is_carrying_battery = True
            break
    
    # 检查场景中是否还有电池未被拾取
    battery_available = False
    battery_room = None
    if not is_carrying_battery:  # 如果机器人没有携带电池，检查是否有电池可拾取
        for room, room_items in state.room_contents.items():
            for item in room_items:
                if ITEM_NAME[item] == "Battery":
                    battery_available = True
                    battery_room = room
                    break
            if battery_available:
                break
    
    # 计算当前强度与目标物品最大重量的比值
    strength_to_weight_ratio = state.robot.strength / max_weight_in_goal if max_weight_in_goal > 0 else float('inf')
    
    # 根据情况调整启发值
    if is_carrying_battery or not battery_available:
        # 已有电池或没有电池可拾取，直接使用基础启发值
        return misplaced_count
    elif battery_available and strength_to_weight_ratio < 1.5:
        # 有电池可拾取且当前力量不足
        # 估计拾取电池的最小成本：
        # 1. 如果机器人已在电池所在房间，至少需要1步（拾取）
        # 2. 如果机器人不在电池所在房间，至少需要2步（移动+拾取）
        battery_cost = 1 if state.robot.location == battery_room else 2
        
        # 这个成本估计不会高估实际成本（甚至可能低估）
        return misplaced_count + battery_cost
    else:
        # 其他情况，使用基础启发值
        return misplaced_count

def make_battery_aware_misplaced(goal):
    # 预计算目标物品中最重的物品重量，使用已有的辅助函数
    max_weight_in_goal = get_max_weight_in_goal(goal)
    
    # 闭包函数中使用预计算的值
    def battery_aware_misplaced_with_goal(state):
        return battery_aware_misplaced(state, goal, max_weight_in_goal)
    
    return battery_aware_misplaced_with_goal

def comprehensive_heuristic(state, goal, max_weight_in_goal):
    # 1. 计算位置错误的物品数量
    misplaced_count = misplaced(state, goal)
    
    # 2. 计算锁定的门数量（只考虑已上锁且机器人未携带对应钥匙的门）
    locked_doors_count = locked_doors(state)
    
    # 3. 检查电池情况
    # 检查机器人是否携带电池
    is_carrying_battery = False
    for item in state.robot.carried_items:
        if ITEM_NAME[item] == "Battery":
            is_carrying_battery = True
            break
    
    # 检查场景中是否还有电池未被拾取
    battery_available = False
    battery_room = None
    if not is_carrying_battery:  # 如果机器人没有携带电池，检查是否有电池可拾取
        for room, room_items in state.room_contents.items():
            for item in room_items:
                if ITEM_NAME[item] == "Battery":
                    battery_available = True
                    battery_room = room
                    break
            if battery_available:
                break
    
    # 计算当前强度与目标物品最大重量的比值
    strength_to_weight_ratio = state.robot.strength / max_weight_in_goal if max_weight_in_goal > 0 else float('inf')
    
    # 4. 计算综合启发值
    # 基础启发值：位置错误的物品数量 + 锁定门的最小成本
    # 每个锁定门至少需要2个动作：拾取钥匙和开门
    heuristic_value = misplaced_count + 2 * locked_doors_count
    
    # 根据电池和强度情况调整启发值
    if not is_carrying_battery and battery_available and strength_to_weight_ratio < 1.5:
        # 估计拾取电池的最小成本
        battery_cost = 1 if state.robot.location == battery_room else 2
        heuristic_value += battery_cost
    
    return heuristic_value

def make_comprehensive_heuristic(goal):
    # 预计算目标物品中最重的物品重量
    max_weight_in_goal = get_max_weight_in_goal(goal)
    
    def comprehensive_heuristic_with_goal(state):
        return comprehensive_heuristic(state, goal, max_weight_in_goal)
    
    return comprehensive_heuristic_with_goal
