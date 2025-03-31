import json
import os
import time
import sys
from classes import Robot, Door, State, RobotWorker, search, ITEM_NAME

from heuristics import make_misplaced, make_carry_right_items, make_locked_doors, make_combined_heuristic
from costs import cost, cost_2

# 搜索策略配置
def get_search_strategies(goal):
    return [
        {"name": "bfs", "mode": "BF/FIFO", "randomise": False, "heuristic_name": "无", "cost_name": "无"},
        {"name": "dfs", "mode": "DF/LIFO", "randomise": False, "heuristic_name": "无", "cost_name": "无"},
        {"name": "dfsr", "mode": "DF/LIFO", "randomise": True, "heuristic_name": "无", "cost_name": "无"},
        {"name": "bestf", "mode": "BF/FIFO", "randomise": False, "heuristic": make_misplaced(goal), "heuristic_name": "misplaced", "cost_name": "无"},
        {"name": "bestf", "mode": "BF/FIFO", "randomise": False, "heuristic": make_carry_right_items(goal), "heuristic_name": "carry_right", "cost_name": "无"},
        {"name": "bestf", "mode": "BF/FIFO", "randomise": False, "heuristic": make_locked_doors(goal), "heuristic_name": "locked_doors", "cost_name": "无"},
        {"name": "bestf", "mode": "BF/FIFO", "randomise": False, "heuristic": make_combined_heuristic(goal), "heuristic_name": "combined", "cost_name": "无"},
        {"name": "A*", "mode": "BF/FIFO", "randomise": False, "heuristic": make_misplaced(goal), "heuristic_name": "misplaced", "cost": cost, "cost_name": "cost"},
        {"name": "A*", "mode": "BF/FIFO", "randomise": False, "heuristic": make_carry_right_items(goal), "heuristic_name": "carry_right", "cost": cost, "cost_name": "cost"},
        {"name": "A*", "mode": "BF/FIFO", "randomise": False, "heuristic": make_locked_doors(goal), "heuristic_name": "locked_doors", "cost": cost, "cost_name": "cost"},
        {"name": "A*", "mode": "BF/FIFO", "randomise": False, "heuristic": make_combined_heuristic(goal), "heuristic_name": "combined", "cost": cost, "cost_name": "cost"}
    ]

# 重定向标准输出，以捕获搜索过程的输出
class OutputCapture:
    def __init__(self):
        self.text = ""
        self.original_stdout = sys.stdout
    
    def write(self, message):
        self.text += message
        # 完全禁止向控制台输出搜索过程
        # self.original_stdout.write(message)
    
    def flush(self):
        # 让flush操作也不产生输出
        pass

def run_tests():
    # 保存原始的标准输出
    original_stdout = sys.stdout
    
    # 创建结果目录（如果不存在）
    if not os.path.exists('results'):
        os.makedirs('results')
    
    # 读取配置文件
    with open('config.json', 'r', encoding='utf-8') as f:
        config_data = json.load(f)
    
    # 为每个测试案例创建结果文件
    result_filename = f'results/search_results_{time.strftime("%Y%m%d_%H%M%S")}.txt'
    result_file = open(result_filename, 'w', encoding='utf-8')
    result_file.write("机器人工人问题搜索测试结果\n")
    result_file.write("="*50 + "\n\n")
    
    # 使用原始的标准输出显示开始测试的信息
    print(f"开始测试，结果将保存到 {result_filename}")
    
    # 遍历每个测试案例
    for case_name, case_data in config_data['cases'].items():
        if case_name not in test_cases:
            continue
        result_file.write(f"案例: {case_name}\n")
        result_file.write("-"*50 + "\n")
        
        # 创建房间内容字典
        room_contents = {}
        for room, items_ids in case_data['room contents'].items():
            room_contents[room] = set(items_ids)
        
        # 创建门列表
        doors = []
        if case_data['doors']:
            # 门的格式为 [roomA, roomB, keyId, locked]
            doors_data = case_data['doors']
            for door_data in doors_data:
                doors.append(Door(door_data[0], door_data[1], door_data[2], door_data[3]))
        
        # 创建机器人
        robot_data = case_data.get('robot', {'carried_items': [], 'strength': 10, 'location': list(room_contents.keys())[0]})
        robot = Robot(
            robot_data['location'],
            robot_data.get('carried_items', []),
            robot_data.get('strength', 10)
        )
        
        # 创建初始状态
        initial_state = State(robot, doors, room_contents)
        
        # 获取目标状态
        goal_item_locations = {}
        if 'goal' in case_data and case_data['goal']:
            # 使用配置中的目标状态
            for room, items in case_data['goal'].items():
                if items:  # 只添加有物品的房间作为目标
                    goal_item_locations[room] = set(items)
        else:
            # 如果没有定义目标状态，跳过此案例
            result_file.write("\n没有定义目标状态，跳过此案例\n\n")
            continue
        
        goal = goal_item_locations.copy()
        # 写入结果表头
        result_file.write("搜索结果:\n")
        result_file.write("策略     |   启发式函数   |   成本函数    |       结果        |   耗时   | 已生成节点  | 已测试节点  | 已抛弃节点  | 剩余节点  | 解路径长度 \n")
        result_file.write("-"*140 + "\n")
        
        # 获取搜索策略列表
        SEARCH_STRATEGIES = get_search_strategies(goal)
        
        # 针对每种搜索策略进行测试
        for strategy_index, strategy in enumerate(SEARCH_STRATEGIES):
            # 我们不再在每个策略开始时显示测试进度
            # 而是在测试完成后统一显示
            
            # 定义测试问题
            test_problem = RobotWorker(initial_state, goal_item_locations)
            
            # 重定向标准输出以捕获搜索结果
            output_capture = OutputCapture()
            sys.stdout = output_capture
            
            # 执行搜索，并获取详细结果
            start_time = time.time()
            search_result = search(
                test_problem, 
                strategy['mode'], 
                1000000, 
                loop_check=True,
                randomise=strategy['randomise'],
                dots=False,  # 确保关闭点号输出
                return_info=True,
                heuristic=strategy['heuristic'] if 'heuristic' in strategy else None,
                cost=strategy['cost'] if 'cost' in strategy else None
            )
            end_time = time.time()
            
            # 恢复标准输出 (但暂时不输出任何信息)
            sys.stdout = original_stdout
            
            # 提取搜索结果
            search_stats = search_result['search_stats']
            search_term_cond = search_result['result']['termination_condition']
            
            # 组装一行结果
            result_line = [
                f"{strategy['name']:<8}",
                f"{strategy['heuristic_name']:<12}",
                f"{strategy['cost_name']:<12}",
                f"{search_term_cond:<16}",
                f"{search_stats['time_taken']:>8.4f}",
                f"{search_stats['nodes_generated']:>10}",
                f"{search_stats['nodes_tested']:>10}",
                f"{search_stats['nodes_discarded']:>10}",
                f"{search_stats['nodes_left_in_queue']:>10}",
                f"{search_result['result']['path_length'] if search_term_cond == 'GOAL_STATE_FOUND' else 'N/A':>10}"
            ]
            
            # 写入一行结果
            result_file.write(" | ".join(result_line) + "\n")
        
        result_file.write("\n")
        # 每个案例测试完成后才输出提示（使用原始标准输出）
        print(f"案例 {case_name} 的所有搜索策略测试完成。")
    
    # 关闭结果文件
    result_file.close()
    print(f"\n所有测试完成，结果已保存到 {result_filename}")

if __name__ == "__main__":
    test_cases = ['sim_1', 'mid_1']
    run_tests() 