#!/usr/bin/env python3
import sys
import json
from classes import Robot, Door, State, RobotWorker
import json

def run_test(test_data):
    try:
        # 加载配置文件
        with open("config.json", "r") as f:
            config_data = json.load(f)
        
        # 获取测试参数
        case_key = test_data["case"]
        robot_location = test_data["robot_location"]
        robot_strength = test_data["robot_strength"]
        goals = test_data["goals"]
        
        # 确保场景存在
        if case_key not in config_data["cases"]:
            return {"success": False, "message": "指定的场景不存在"}
        
        case_data = config_data["cases"][case_key]
        room_contents = case_data["room contents"]
        
        # 确保机器人位置有效
        if robot_location not in room_contents:
            return {"success": False, "message": "机器人初始位置无效"}
        
        # 准备房间内容（转换为集合）
        room_contents_sets = {}
        for room, items in room_contents.items():
            room_contents_sets[room] = set(items)
        
        # 准备门信息
        doors_data = case_data["doors"]
        doors = []
        if doors_data:
            room_a = doors_data[0]
            room_b = doors_data[1]
            doorkey = doors_data[2]
            locked = doors_data[3]
            doors.append(Door(room_a, room_b, doorkey, locked))
        
        # 创建机器人
        robot = Robot(robot_location, [], robot_strength)
        
        # 创建初始状态
        initial_state = State(robot, doors, room_contents_sets)
        
        # 准备目标物品位置
        goal_item_locations = {}
        for room, items in goals.items():
            if room not in goal_item_locations:
                goal_item_locations[room] = set()
            for item in items:
                goal_item_locations[room].add(item)
        
        # 创建问题实例
        problem = RobotWorker(initial_state, goal_item_locations)
        
        # 运行搜索（导入搜索模块）
        from bbSearch import search
        result = search(problem, 'BF/FIFO', 100000, loop_check=True)
        
        # 处理结果
        if result == "GOAL_STATE_FOUND":
            # 搜索成功，提取路径和最终状态
            path = problem.path
            final_state = problem.final_state
            
            return {
                "success": True,
                "status": "成功找到解决方案",
                "path_length": len(path),
                "actions": [str(action) for action in path],
                "final_state": str(final_state)
            }
        else:
            # 搜索失败
            return {
                "success": False,
                "message": "无法找到解决方案",
                "result": result
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"运行测试时出错: {str(e)}"
        }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "message": "参数错误"}))
        sys.exit(1)
    
    try:
        test_data = json.loads(sys.argv[1])
        result = run_test(test_data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "message": f"执行测试时出错: {str(e)}"}))
        sys.exit(1) 