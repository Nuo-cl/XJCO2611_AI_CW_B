import json
import os
import time
import sys
from classes import Robot, Door, State, RobotWorker, search, ITEM_NAME

# 搜索策略配置
SEARCH_STRATEGIES = [
    {"name": "广度优先搜索", "mode": "BF/FIFO", "randomise": False},
    {"name": "深度优先搜索", "mode": "DF/LIFO", "randomise": False},
    {"name": "深度优先搜索（随机化）", "mode": "DF/LIFO", "randomise": True}
]

# 重定向标准输出，以捕获搜索过程的输出
class OutputCapture:
    def __init__(self):
        self.text = ""
        self.original_stdout = sys.stdout
    
    def write(self, message):
        self.text += message
        # 不向控制台输出搜索过程
        # self.original_stdout.write(message)
    
    def flush(self):
        self.original_stdout.flush()

def run_tests():
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
    
    print(f"开始测试，结果将保存到 {result_filename}")
    
    # 遍历每个测试案例
    for case_name, case_data in config_data['cases'].items():
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
            door_data = case_data['doors']
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
        
        # 写入结果表头
        result_file.write("搜索结果:\n")
        result_file.write("策略 | 模式 | 随机化 | 结果 | 耗时(秒) | 已生成节点 | 已测试节点 | 已抛弃节点 | 剩余节点 | 解路径长度\n")
        result_file.write("-"*100 + "\n")
        
        # 针对每种搜索策略进行测试
        for strategy_index, strategy in enumerate(SEARCH_STRATEGIES):
            # 控制台显示正在测试的策略
            print(f"\r正在测试 {case_name} - {strategy['name']}...", end="")
            
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
                dots=False,
                return_info=True
            )
            end_time = time.time()
            
            # 恢复标准输出
            sys.stdout = sys.__stdout__
            
            # 提取搜索结果
            search_stats = search_result['search_stats']
            search_term_cond = search_result['result']['termination_condition']
            
            # 组装一行结果
            result_line = [
                strategy['name'],
                strategy['mode'],
                '是' if strategy['randomise'] else '否',
                search_term_cond,
                f"{search_stats['time_taken']:.4f}",
                str(search_stats['nodes_generated']),
                str(search_stats['nodes_tested']),
                str(search_stats['nodes_discarded']),
                str(search_stats['nodes_left_in_queue']),
                str(search_result['result']['path_length'] if search_term_cond == "GOAL_STATE_FOUND" else "N/A")
            ]
            
            # 写入一行结果
            result_file.write(" | ".join(result_line) + "\n")
        
        result_file.write("\n")
        # 每个案例测试完成后输出提示
        print(f"\r案例 {case_name} 的所有搜索策略测试完成。")
    
    # 关闭结果文件
    result_file.close()
    print(f"\n所有测试完成，结果已保存到 {result_filename}")

if __name__ == "__main__":
    run_tests() 