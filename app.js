// 全局数据存储
let configData = {
    items: [],
    cases: {}
};

// 页面加载时执行
document.addEventListener('DOMContentLoaded', () => {
    // 加载配置数据
    loadConfigData();
});

// 加载配置数据
async function loadConfigData() {
    try {
        // 尝试从本地文件加载
        try {
            const response = await fetch('config.json');
            if (response.ok) {
                configData = await response.json();
                console.log('从本地文件加载了配置数据');
                
                // 加载物品列表
                displayItems();
                
                // 加载场景列择器
                populateCaseSelector();
                
                return;
            }
        } catch (error) {
            console.warn('无法从本地文件加载配置:', error);
        }
        
        // 直接使用空白数据
        console.log('没有找到配置文件，使用空白数据');
        
        // 使用空白数据
        configData = {
            items: [],
            cases: {}
        };
        
        // 加载物品列表
        displayItems();
        
        // 加载场景列择器
        populateCaseSelector();
        
        // 显示欢迎信息和文件上传选项
        const welcomeMsg = document.createElement('div');
        welcomeMsg.className = 'welcome-message';
        welcomeMsg.style.padding = '10px';
        welcomeMsg.style.backgroundColor = '#f0fff0';
        welcomeMsg.style.border = '1px solid #98fb98';
        welcomeMsg.style.borderRadius = '5px';
        welcomeMsg.style.margin = '10px 0';
        welcomeMsg.innerHTML = `
            <p>欢迎使用机器人工人问题配置界面！当前没有加载任何配置。</p>
            <p>您可以手动创建配置，或上传现有的配置文件:</p>
            <input type="file" id="config-upload" accept=".json">
        `;
        
        document.querySelector('.container').insertBefore(welcomeMsg, document.querySelector('.tab'));
        
        // 添加文件上传事件监听器
        document.getElementById('config-upload').addEventListener('change', handleFileUpload);
    } catch (error) {
        console.error('加载配置数据时出错:', error);
        alert('加载配置数据失败，请检查控制台获取详细信息。');
    }
}

// 处理配置文件上传
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // 验证数据格式
            if (!data.items || !data.cases) {
                throw new Error('无效的配置文件格式');
            }
            
            // 更新配置数据
            configData = data;
            
            // 重新加载界面
            displayItems();
            populateCaseSelector();
            
            // 保存到localStorage
            localStorage.setItem('rw_config_data', JSON.stringify(configData));
            
            alert('配置文件已成功加载！');
            
            // 移除上传消息
            const loadMsg = document.querySelector('.load-message');
            if (loadMsg) loadMsg.remove();
            
            const welcomeMsg = document.querySelector('.welcome-message');
            if (welcomeMsg) welcomeMsg.remove();
        } catch (error) {
            console.error('解析配置文件时出错:', error);
            alert('无法解析配置文件，请确保它是有效的JSON格式。');
        }
    };
    
    reader.readAsText(file);
}

// 展示物品列表
function displayItems() {
    const itemsBody = document.getElementById('items-body');
    itemsBody.innerHTML = '';
    
    configData.items.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'item-row';
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.weight}</td>
            <td>
                <button onclick="editItem(${item.id})">编辑</button>
                <button onclick="deleteItem(${item.id})">删除</button>
            </td>
        `;
        itemsBody.appendChild(row);
    });
}

// 添加新物品
function addNewItem() {
    // 显示添加物品表单
    document.getElementById('item-form').style.display = 'block';
    document.getElementById('edit-item-id').value = '';
    document.getElementById('item-name').value = '';
    document.getElementById('item-weight').value = '';
}

// 编辑物品
function editItem(id) {
    const item = configData.items.find(item => item.id === id);
    if (item) {
        document.getElementById('item-form').style.display = 'block';
        document.getElementById('edit-item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-weight').value = item.weight;
    }
}

// 取消编辑物品
function cancelItemEdit() {
    document.getElementById('item-form').style.display = 'none';
}

// 保存物品
function saveItem() {
    const idInput = document.getElementById('edit-item-id');
    const nameInput = document.getElementById('item-name');
    const weightInput = document.getElementById('item-weight');
    
    if (!nameInput.value.trim()) {
        alert('请输入物品名称');
        return;
    }
    
    if (isNaN(weightInput.value) || weightInput.value === '') {
        alert('请输入有效的重量值');
        return;
    }
    
    const weight = parseFloat(weightInput.value);
    
    if (idInput.value) {
        // 更新现有物品
        const id = parseInt(idInput.value);
        const index = configData.items.findIndex(item => item.id === id);
        if (index !== -1) {
            configData.items[index].name = nameInput.value;
            configData.items[index].weight = weight;
        }
    } else {
        // 添加新物品
        const newId = configData.items.length > 0 
            ? Math.max(...configData.items.map(item => item.id)) + 1 
            : 0;
        
        configData.items.push({
            id: newId,
            name: nameInput.value,
            weight: weight
        });
    }
    
    // 保存配置并刷新显示
    saveConfigData();
    displayItems();
    
    // 隐藏表单
    document.getElementById('item-form').style.display = 'none';
}

// 删除物品
function deleteItem(id) {
    if (confirm('确定要删除这个物品吗？这可能会影响现有场景。')) {
        configData.items = configData.items.filter(item => item.id !== id);
        saveConfigData();
        displayItems();
    }
}

// 填充场景选择器
function populateCaseSelector() {
    const selector = document.getElementById('case-selector');
    selector.innerHTML = '';
    
    Object.keys(configData.cases).forEach(caseKey => {
        const option = document.createElement('option');
        option.value = caseKey;
        option.textContent = caseKey;
        selector.appendChild(option);
    });
    
    // 如果有场景，加载第一个场景的详细信息
    if (selector.options.length > 0) {
        loadCaseDetails();
    }
}

// 加载场景详细信息
function loadCaseDetails() {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey]) {
        document.getElementById('case-details').innerHTML = '<p>请选择或创建一个场景</p>';
        return;
    }
    
    const caseData = configData.cases[caseKey];
    
    // 显示机器人设置
    displayRobotSettings(caseData);
    
    // 显示房间和其内容
    displayRooms(caseData['room contents']);
    
    // 显示门连接
    displayDoors(caseData.doors);
    
    // 显示目标状态
    displayGoalSettings(caseData);
}

// 显示机器人设置
function displayRobotSettings(caseData) {
    // 确保场景有robot字段
    if (!caseData.robot) {
        caseData.robot = {
            carried_items: [],
            strength: 10,
            location: Object.keys(caseData['room contents'])[0] || ''
        };
    }
    
    // 设置力量值
    const strengthInput = document.getElementById('robot-strength');
    strengthInput.value = caseData.robot.strength;
    
    // 更新位置选择器
    const locationSelect = document.getElementById('robot-location');
    locationSelect.innerHTML = '';
    
    // 添加所有房间作为可能的位置
    const rooms = Object.keys(caseData['room contents']);
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room;
        option.text = room;
        if (room === caseData.robot.location) {
            option.selected = true;
        }
        locationSelect.appendChild(option);
    });
    
    // 显示已携带物品
    displayCarriedItems(caseData.robot.carried_items);
}

// 显示已携带物品
function displayCarriedItems(carriedItems) {
    const carriedItemsList = document.getElementById('carried-items-list');
    carriedItemsList.innerHTML = '';
    
    if (!carriedItems || carriedItems.length === 0) {
        carriedItemsList.innerHTML = '<p>无携带物品</p>';
        return;
    }
    
    carriedItems.forEach((itemId, index) => {
        const item = configData.items.find(i => i.id === itemId);
        if (item) {
            const itemElement = document.createElement('div');
            itemElement.className = 'carried-item';
            itemElement.innerHTML = `
                <span>${item.name} (重量: ${item.weight})</span>
                <button onclick="removeCarriedItem(${index})">移除</button>
            `;
            carriedItemsList.appendChild(itemElement);
        }
    });
}

// 添加携带物品
function addCarriedItem() {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey]) {
        alert('请先选择一个场景');
        return;
    }
    
    // 获取所有可用物品（排除已携带的）
    const carriedItems = configData.cases[caseKey].robot.carried_items || [];
    const availableItems = configData.items.filter(item => !carriedItems.includes(item.id));
    
    if (availableItems.length === 0) {
        alert('没有可添加的物品');
        return;
    }
    
    // 创建一个选择框
    const itemSelect = document.createElement('select');
    itemSelect.id = 'carried-item-select';
    
    availableItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} (重量: ${item.weight})`;
        itemSelect.appendChild(option);
    });
    
    // 创建一个确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确认添加';
    confirmButton.onclick = () => {
        const selectedItemId = parseInt(itemSelect.value);
        
        // 添加到已携带物品
        if (!configData.cases[caseKey].robot.carried_items) {
            configData.cases[caseKey].robot.carried_items = [];
        }
        
        configData.cases[caseKey].robot.carried_items.push(selectedItemId);
        
        // 更新显示
        displayCarriedItems(configData.cases[caseKey].robot.carried_items);
        
        // 移除选择界面
        itemSelectContainer.remove();
    };
    
    // 创建一个取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.onclick = () => {
        itemSelectContainer.remove();
    };
    
    // 创建容器
    const itemSelectContainer = document.createElement('div');
    itemSelectContainer.style.marginTop = '10px';
    itemSelectContainer.appendChild(document.createTextNode('选择要添加的物品: '));
    itemSelectContainer.appendChild(itemSelect);
    itemSelectContainer.appendChild(document.createElement('br'));
    itemSelectContainer.appendChild(confirmButton);
    itemSelectContainer.appendChild(cancelButton);
    
    // 添加到列表
    document.getElementById('carried-items-list').appendChild(itemSelectContainer);
}

// 删除携带物品
function removeCarriedItem(index) {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey] || !configData.cases[caseKey].robot) {
        return;
    }
    
    // 从列表中移除
    configData.cases[caseKey].robot.carried_items.splice(index, 1);
    
    // 更新显示
    displayCarriedItems(configData.cases[caseKey].robot.carried_items);
}

// 显示房间和内容
function displayRooms(roomContents) {
    const roomsContainer = document.getElementById('rooms-container');
    roomsContainer.innerHTML = '';
    
    Object.keys(roomContents).forEach(room => {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        
        const roomHeader = document.createElement('h4');
        roomHeader.textContent = room;
        
        const itemsList = document.createElement('ul');
        const roomItems = roomContents[room];
        
        roomItems.forEach(itemId => {
            const item = configData.items.find(i => i.id === itemId);
            if (item) {
                const itemElement = document.createElement('li');
                itemElement.textContent = `${item.name} (重量: ${item.weight})`;
                itemsList.appendChild(itemElement);
            }
        });
        
        const addItemButton = document.createElement('button');
        addItemButton.textContent = '添加物品';
        addItemButton.onclick = () => addItemToRoom(room);
        
        roomCard.appendChild(roomHeader);
        roomCard.appendChild(itemsList);
        roomCard.appendChild(addItemButton);
        
        roomsContainer.appendChild(roomCard);
    });
}

// 显示门连接
function displayDoors(doorData) {
    const doorsContainer = document.getElementById('doors-container');
    doorsContainer.innerHTML = '';
    
    if (Array.isArray(doorData)) {
        const roomA = doorData[0];
        const roomB = doorData[1];
        const keyId = doorData[2];
        const locked = doorData[3];
        
        const doorItem = document.createElement('div');
        doorItem.className = 'door-item';
        
        const keyItem = configData.items.find(i => i.id === keyId);
        const keyName = keyItem ? keyItem.name : '无钥匙';
        
        doorItem.innerHTML = `
            <p>连接: ${roomA} - ${roomB}</p>
            <p>钥匙: ${keyName}</p>
            <p>状态: ${locked ? '已锁' : '未锁'}</p>
            <button onclick="editDoor(0)">编辑</button>
        `;
        
        doorsContainer.appendChild(doorItem);
    }
}

// 添加物品到房间
function addItemToRoom(room) {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey]) {
        alert('请先选择一个场景');
        return;
    }
    
    const availableItems = configData.items.filter(item => {
        // 检查该物品是否已在其他房间
        let inOtherRoom = false;
        const roomContents = configData.cases[caseKey]['room contents'];
        
        for (const r in roomContents) {
            if (roomContents[r].includes(item.id)) {
                inOtherRoom = true;
                break;
            }
        }
        
        return !inOtherRoom;
    });
    
    if (availableItems.length === 0) {
        alert('没有可用的物品。所有物品已分配到房间中。');
        return;
    }
    
    // 创建一个选择框让用户选择物品
    const itemSelect = document.createElement('select');
    itemSelect.id = 'add-item-select';
    
    availableItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} (重量: ${item.weight})`;
        itemSelect.appendChild(option);
    });
    
    // 创建一个确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确认添加';
    confirmButton.onclick = () => {
        const selectedItemId = parseInt(itemSelect.value);
        configData.cases[caseKey]['room contents'][room].push(selectedItemId);
        saveConfigData();
        loadCaseDetails();
        itemSelectContainer.remove();
    };
    
    // 创建一个取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.onclick = () => {
        itemSelectContainer.remove();
    };
    
    // 创建容器并添加所有元素
    const itemSelectContainer = document.createElement('div');
    itemSelectContainer.style.marginTop = '10px';
    itemSelectContainer.appendChild(document.createTextNode('选择要添加的物品: '));
    itemSelectContainer.appendChild(itemSelect);
    itemSelectContainer.appendChild(document.createElement('br'));
    itemSelectContainer.appendChild(confirmButton);
    itemSelectContainer.appendChild(cancelButton);
    
    // 找到对应的房间卡片并添加选择容器
    const roomCards = document.querySelectorAll('.room-card');
    for (const card of roomCards) {
        if (card.querySelector('h4').textContent === room) {
            card.appendChild(itemSelectContainer);
            break;
        }
    }
}

// 添加新房间
function addNewRoom() {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey]) {
        alert('请先选择一个场景');
        return;
    }
    
    const roomName = prompt('请输入新房间名称:');
    
    if (roomName && roomName.trim()) {
        // 检查房间名是否已存在
        if (configData.cases[caseKey]['room contents'][roomName]) {
            alert('该房间名已存在');
            return;
        }
        
        // 添加新房间
        configData.cases[caseKey]['room contents'][roomName] = [];
        
        // 如果这是第一个房间，将其设为机器人的初始位置
        if (!configData.cases[caseKey].robot) {
            configData.cases[caseKey].robot = {
                carried_items: [],
                strength: 10,
                location: roomName
            };
        } else if (!configData.cases[caseKey].robot.location) {
            configData.cases[caseKey].robot.location = roomName;
        }
        
        saveConfigData();
        loadCaseDetails();
    }
}

// 添加新门
function addNewDoor() {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey]) {
        alert('请先选择一个场景');
        return;
    }
    
    const roomContents = configData.cases[caseKey]['room contents'];
    const rooms = Object.keys(roomContents);
    
    if (rooms.length < 2) {
        alert('需要至少两个房间才能添加门');
        return;
    }
    
    // 创建一个表单让用户选择房间和门的属性
    const doorForm = document.createElement('div');
    doorForm.innerHTML = `
        <h3>添加新门</h3>
        <div>
            <label for="door-room-a">房间 A:</label>
            <select id="door-room-a">
                ${rooms.map(room => `<option value="${room}">${room}</option>`).join('')}
            </select>
        </div>
        <div>
            <label for="door-room-b">房间 B:</label>
            <select id="door-room-b">
                ${rooms.map(room => `<option value="${room}">${room}</option>`).join('')}
            </select>
        </div>
        <div>
            <label for="door-key">钥匙:</label>
            <select id="door-key">
                <option value="">无需钥匙</option>
                ${configData.items.map(item => `<option value="${item.id}">${item.name}</option>`).join('')}
            </select>
        </div>
        <div>
            <label for="door-locked">是否锁定:</label>
            <select id="door-locked">
                <option value="false">未锁</option>
                <option value="true">已锁</option>
            </select>
        </div>
        <div class="action-buttons">
            <button id="cancel-door">取消</button>
            <button id="confirm-door">确认</button>
        </div>
    `;
    
    document.getElementById('doors-container').appendChild(doorForm);
    
    // 添加事件监听器
    document.getElementById('cancel-door').onclick = () => {
        doorForm.remove();
    };
    
    document.getElementById('confirm-door').onclick = () => {
        const roomA = document.getElementById('door-room-a').value;
        const roomB = document.getElementById('door-room-b').value;
        const keyId = document.getElementById('door-key').value ? parseInt(document.getElementById('door-key').value) : null;
        const locked = document.getElementById('door-locked').value === 'true';
        
        if (roomA === roomB) {
            alert('门必须连接两个不同的房间');
            return;
        }
        
        // 设置新门
        configData.cases[caseKey].doors = [roomA, roomB, keyId, locked];
        saveConfigData();
        loadCaseDetails();
        doorForm.remove();
    };
}

// 编辑门
function editDoor(index) {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey] || !configData.cases[caseKey].doors) {
        alert('无效的场景或门数据');
        return;
    }
    
    const doorData = configData.cases[caseKey].doors;
    const roomContents = configData.cases[caseKey]['room contents'];
    const rooms = Object.keys(roomContents);
    
    if (rooms.length < 2) {
        alert('需要至少两个房间才能编辑门');
        return;
    }
    
    // 创建一个表单让用户编辑门的属性
    const doorForm = document.createElement('div');
    doorForm.innerHTML = `
        <h3>编辑门</h3>
        <div>
            <label for="door-room-a">房间 A:</label>
            <select id="door-room-a">
                ${rooms.map(room => `<option value="${room}" ${room === doorData[0] ? 'selected' : ''}>${room}</option>`).join('')}
            </select>
        </div>
        <div>
            <label for="door-room-b">房间 B:</label>
            <select id="door-room-b">
                ${rooms.map(room => `<option value="${room}" ${room === doorData[1] ? 'selected' : ''}>${room}</option>`).join('')}
            </select>
        </div>
        <div>
            <label for="door-key">钥匙:</label>
            <select id="door-key">
                <option value="">无需钥匙</option>
                ${configData.items.map(item => `<option value="${item.id}" ${item.id === doorData[2] ? 'selected' : ''}>${item.name}</option>`).join('')}
            </select>
        </div>
        <div>
            <label for="door-locked">是否锁定:</label>
            <select id="door-locked">
                <option value="false" ${!doorData[3] ? 'selected' : ''}>未锁</option>
                <option value="true" ${doorData[3] ? 'selected' : ''}>已锁</option>
            </select>
        </div>
        <div class="action-buttons">
            <button id="cancel-door">取消</button>
            <button id="confirm-door">确认</button>
        </div>
    `;
    
    document.getElementById('doors-container').appendChild(doorForm);
    
    // 添加事件监听器
    document.getElementById('cancel-door').onclick = () => {
        doorForm.remove();
    };
    
    document.getElementById('confirm-door').onclick = () => {
        const roomA = document.getElementById('door-room-a').value;
        const roomB = document.getElementById('door-room-b').value;
        const keyId = document.getElementById('door-key').value ? parseInt(document.getElementById('door-key').value) : null;
        const locked = document.getElementById('door-locked').value === 'true';
        
        if (roomA === roomB) {
            alert('门必须连接两个不同的房间');
            return;
        }
        
        // 更新门
        configData.cases[caseKey].doors = [roomA, roomB, keyId, locked];
        saveConfigData();
        loadCaseDetails();
        doorForm.remove();
    };
}

// 显示目标状态设置
function displayGoalSettings(caseData) {
    const goalContainer = document.getElementById('goal-rooms-container');
    goalContainer.innerHTML = '';
    
    // 确保goal字段存在
    if (!caseData.goal) {
        caseData.goal = {};
    }
    
    // 显示每个目标房间及其物品
    Object.keys(caseData.goal).forEach(room => {
        const goalItems = caseData.goal[room];
        addGoalRoomToDisplay(room, goalItems);
    });
    
    // 如果没有目标房间，显示提示信息
    if (Object.keys(caseData.goal).length === 0) {
        goalContainer.innerHTML = '<p>没有设置目标状态，请添加目标房间和物品</p>';
    }
}

// 将目标房间添加到显示
function addGoalRoomToDisplay(room, items) {
    const goalContainer = document.getElementById('goal-rooms-container');
    
    const roomElement = document.createElement('div');
    roomElement.className = 'goal-room';
    
    const roomHeader = document.createElement('h4');
    roomHeader.textContent = room;
    
    const itemsList = document.createElement('div');
    itemsList.className = 'goal-items-list';
    
    // 添加已有的目标物品
    items.forEach(itemId => {
        const item = configData.items.find(i => i.id === itemId);
        if (item) {
            const itemElement = document.createElement('div');
            itemElement.className = 'goal-item';
            itemElement.innerHTML = `
                <span>${item.name} (重量: ${item.weight})</span>
                <button onclick="removeGoalItem('${room}', ${itemId})">移除</button>
            `;
            itemsList.appendChild(itemElement);
        }
    });
    
    // 添加按钮
    const addItemButton = document.createElement('button');
    addItemButton.textContent = '添加目标物品';
    addItemButton.onclick = () => addGoalItem(room);
    
    const removeRoomButton = document.createElement('button');
    removeRoomButton.textContent = '移除目标房间';
    removeRoomButton.style.backgroundColor = '#ff4d4f';
    removeRoomButton.onclick = () => removeGoalRoom(room);
    
    // 组装元素
    roomElement.appendChild(roomHeader);
    roomElement.appendChild(itemsList);
    roomElement.appendChild(addItemButton);
    roomElement.appendChild(removeRoomButton);
    
    goalContainer.appendChild(roomElement);
}

// 添加目标房间
function addGoalRoom() {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey]) {
        alert('请先选择一个场景');
        return;
    }
    
    // 获取所有可用的房间（排除已在目标中的）
    const roomContents = configData.cases[caseKey]['room contents'];
    const existingGoalRooms = Object.keys(configData.cases[caseKey].goal || {});
    const availableRooms = Object.keys(roomContents).filter(
        room => !existingGoalRooms.includes(room)
    );
    
    if (availableRooms.length === 0) {
        alert('所有房间已经添加到目标中');
        return;
    }
    
    // 创建选择框
    const roomSelect = document.createElement('select');
    roomSelect.id = 'goal-room-select';
    
    availableRooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room;
        option.textContent = room;
        roomSelect.appendChild(option);
    });
    
    // 创建确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确认添加';
    confirmButton.onclick = () => {
        const selectedRoom = roomSelect.value;
        
        // 确保goal对象存在
        if (!configData.cases[caseKey].goal) {
            configData.cases[caseKey].goal = {};
        }
        
        // 添加空的目标房间
        configData.cases[caseKey].goal[selectedRoom] = [];
        
        // 更新显示
        displayGoalSettings(configData.cases[caseKey]);
        
        // 移除选择界面
        selectorContainer.remove();
    };
    
    // 创建取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.onclick = () => {
        selectorContainer.remove();
    };
    
    // 创建容器
    const selectorContainer = document.createElement('div');
    selectorContainer.style.marginTop = '10px';
    selectorContainer.appendChild(document.createTextNode('选择要添加的房间: '));
    selectorContainer.appendChild(roomSelect);
    selectorContainer.appendChild(document.createElement('br'));
    selectorContainer.appendChild(confirmButton);
    selectorContainer.appendChild(cancelButton);
    
    // 添加到容器
    document.getElementById('goal-rooms-container').appendChild(selectorContainer);
}

// 移除目标房间
function removeGoalRoom(room) {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey] || !configData.cases[caseKey].goal) {
        return;
    }
    
    // 移除目标房间
    delete configData.cases[caseKey].goal[room];
    
    // 更新显示
    displayGoalSettings(configData.cases[caseKey]);
}

// 添加目标物品
function addGoalItem(room) {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey]) {
        alert('请先选择一个场景');
        return;
    }
    
    // 获取所有可用物品（排除已在该目标房间的）
    const currentGoalItems = configData.cases[caseKey].goal[room] || [];
    const availableItems = configData.items.filter(
        item => !currentGoalItems.includes(item.id)
    );
    
    if (availableItems.length === 0) {
        alert('没有可添加的物品');
        return;
    }
    
    // 创建选择框
    const itemSelect = document.createElement('select');
    itemSelect.id = 'goal-item-select';
    
    availableItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} (重量: ${item.weight})`;
        itemSelect.appendChild(option);
    });
    
    // 创建确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确认添加';
    confirmButton.onclick = () => {
        const selectedItemId = parseInt(itemSelect.value);
        
        // 确保goal对象和房间数组存在
        if (!configData.cases[caseKey].goal) {
            configData.cases[caseKey].goal = {};
        }
        if (!configData.cases[caseKey].goal[room]) {
            configData.cases[caseKey].goal[room] = [];
        }
        
        // 添加到目标物品
        configData.cases[caseKey].goal[room].push(selectedItemId);
        
        // 更新显示
        displayGoalSettings(configData.cases[caseKey]);
        
        // 移除选择界面
        selectorContainer.remove();
    };
    
    // 创建取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.onclick = () => {
        selectorContainer.remove();
    };
    
    // 创建容器
    const selectorContainer = document.createElement('div');
    selectorContainer.style.marginTop = '10px';
    selectorContainer.appendChild(document.createTextNode('选择要添加的物品: '));
    selectorContainer.appendChild(itemSelect);
    selectorContainer.appendChild(document.createElement('br'));
    selectorContainer.appendChild(confirmButton);
    selectorContainer.appendChild(cancelButton);
    
    // 查找目标房间元素并添加选择器
    const goalRooms = document.querySelectorAll('.goal-room');
    for (const element of goalRooms) {
        if (element.querySelector('h4').textContent === room) {
            element.appendChild(selectorContainer);
            break;
        }
    }
}

// 移除目标物品
function removeGoalItem(room, itemId) {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey] || !configData.cases[caseKey].goal || !configData.cases[caseKey].goal[room]) {
        return;
    }
    
    // 从目标中移除物品
    configData.cases[caseKey].goal[room] = configData.cases[caseKey].goal[room].filter(id => id !== itemId);
    
    // 如果房间没有目标物品了，考虑是否移除整个房间
    if (configData.cases[caseKey].goal[room].length === 0) {
        if (confirm(`房间 "${room}" 已没有目标物品，是否移除整个目标房间？`)) {
            delete configData.cases[caseKey].goal[room];
        }
    }
    
    // 更新显示
    displayGoalSettings(configData.cases[caseKey]);
}

// 添加新场景
function addNewCase() {
    const caseName = prompt('请输入新场景名称:');
    
    if (caseName && caseName.trim()) {
        // 检查场景名是否已存在
        if (configData.cases[caseName]) {
            alert('该场景名已存在');
            return;
        }
        
        // 添加新场景
        configData.cases[caseName] = {
            'room contents': {
                'room1': []
            },
            'doors': [],
            'robot': {
                'carried_items': [],
                'strength': 10,
                'location': 'room1'
            },
            'goal': {}
        };
        
        saveConfigData();
        populateCaseSelector();
        
        // 选择新创建的场景
        document.getElementById('case-selector').value = caseName;
        loadCaseDetails();
    }
}

// 删除当前场景
function deleteCase() {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey) {
        alert('请先选择一个场景');
        return;
    }
    
    if (confirm(`确定要删除场景 "${caseKey}" 吗？`)) {
        delete configData.cases[caseKey];
        saveConfigData();
        populateCaseSelector();
    }
}

// 保存当前场景
function saveCase() {
    const caseKey = document.getElementById('case-selector').value;
    
    if (!caseKey || !configData.cases[caseKey]) {
        alert('请先选择一个场景');
        return;
    }
    
    // 获取并保存机器人设置
    const robotStrength = parseInt(document.getElementById('robot-strength').value);
    const robotLocation = document.getElementById('robot-location').value;
    
    // 确保robot对象存在
    if (!configData.cases[caseKey].robot) {
        configData.cases[caseKey].robot = {
            carried_items: [],
            strength: 10,
            location: ''
        };
    }
    
    configData.cases[caseKey].robot.strength = robotStrength;
    configData.cases[caseKey].robot.location = robotLocation;
    
    // 保存配置
    saveConfigData();
    alert('场景已保存');
}

// 保存配置数据
async function saveConfigData() {
    try {
        // 使用localStorage保存
        localStorage.setItem('rw_config_data', JSON.stringify(configData));
        console.log('配置已保存到localStorage');
        
        // 复制到剪贴板
        const jsonString = JSON.stringify(configData, null, 2);
        await navigator.clipboard.writeText(jsonString).then(() => {
            // 显示成功消息
            const successMsg = document.createElement('div');
            successMsg.className = 'copy-message';
            successMsg.style.padding = '10px';
            successMsg.style.backgroundColor = '#f0fff0';
            successMsg.style.border = '1px solid #98fb98';
            successMsg.style.borderRadius = '5px';
            successMsg.style.margin = '10px 0';
            successMsg.style.position = 'fixed';
            successMsg.style.bottom = '20px';
            successMsg.style.right = '20px';
            successMsg.style.zIndex = '1000';
            successMsg.innerHTML = `
                <p>✅ 配置已复制到剪贴板</p>
                <p>请手动将内容粘贴到config.json文件中保存</p>
            `;
            
            // 移除之前的消息
            const existingMsg = document.querySelector('.copy-message');
            if (existingMsg) {
                existingMsg.remove();
            }
            
            document.body.appendChild(successMsg);
            
            // 3秒后自动消失
            setTimeout(() => {
                successMsg.style.opacity = '0';
                successMsg.style.transition = 'opacity 0.5s ease';
                setTimeout(() => successMsg.remove(), 500);
            }, 3000);
            
        }).catch(err => {
            console.error('复制到剪贴板失败:', err);
            alert('复制到剪贴板失败，请检查浏览器权限设置。');
        });
        
    } catch (error) {
        console.error('保存配置数据时出错:', error);
        alert('无法保存配置数据。');
    }
}

// 切换标签页
function openTab(evt, tabName) {
    // 隐藏所有标签内容
    const tabcontents = document.getElementsByClassName('tabcontent');
    for (let i = 0; i < tabcontents.length; i++) {
        tabcontents[i].style.display = 'none';
    }
    
    // 移除所有标签按钮的活动状态
    const tablinks = document.getElementsByClassName('tablinks');
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }
    
    // 显示当前标签内容并将按钮标记为活动状态
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.className += ' active';
} 