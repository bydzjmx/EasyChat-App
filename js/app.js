window.app = {
	
	/**
	 * netty服务后端发布地址
	 */
	nettyServerUrl : "ws://106.12.61.108:9999/ws",
	
	/**
	 * 服务后端发布地址
	 */
	serverUrl : "http://106.12.61.108:8080/",
	
	/**
	 * 图片服务器地址
	 */
	imgServerUrl : "http://106.12.61.108:88/group1/",
	
	/**
	 * 判断字符串是否为空
	 * @param {Object} str
	 * true: 不为空
	 * false: 为空
	 */
	isNotNull: function(str){
		if(str !=null && str != "" && str !=undefined){
			return true;
		}
		return false;
		
	},
	/**
	 * 封装消息提示框, 默认mui的不支持居中和自定义icon, 使用5+原生api
	 * @param {Object} msg 消息
	 * @param {Object} type 消息类型
	 */
	showToast: function(msg,type){
		//使用原生ui弹出toast提示
		plus.nativeUI.toast(msg, {icon: "image/" + type + ".png", verticalAlign: "center"});
	},
	/**
	 * 保存全局用户对象到缓存,传入对象。
	 * @param {Object} data
	 */
	setUserGlobalInfo: function(data){
		//以json格式存储
		plus.storage.setItem("userInfo",JSON.stringify(data));
	},
	/**
	 * 根据存储key获取全局用户对象,返回对象
	 * @param {Object} key 存储的key
	 */
	getUserGlobalInfo: function(){
		var userInfo = plus.storage.getItem("userInfo");
		return JSON.parse(userInfo);
	},
	
	/**
	 * 用户退出,移除全局用户对象
	 */
	userLogout: function(){
		plus.storage.removeItem("userInfo");
	},
	
	/**
	 * 保持用户的联系人列表
	 */
	setContactList: function(data){
		var contactListStr = JSON.stringify(data);
		plus.storage.setItem("contactList",contactListStr);
	},
	
	/**
	 * 获取本地缓存中的联系人列表
	 */
	getContactList: function(){
		var contactList = plus.storage.getItem("contactList");
		if(!this.isNotNull(contactList)) {
			return [];
		}
		return JSON.parse(contactList);
	},
	
	/**
	 * 和后端的枚举对应
	 */
	//"第一次(或重连)初始化连接"
	CONNECT: 1,
	//聊天消息
	CHAT: 2,
	//消息签收
	SIGNED: 3,
	//客户端保持心跳
	KEEPALIVE: 4, 
	//拉取好友
	PULL_FRIEND: 5, 
	
	/**
	 * 和后端的 ChatData 聊天模型对象保持一致
	 * @param {Object} senderId
	 * @param {Object} receiverId
	 * @param {Object} msg
	 * @param {Object} msgId
	 */
	ChatData: function(senderId, receiverId, msg, msgId){
		this.senderId = senderId;
		this.receiverId = receiverId;
		this.msg = msg;
		this.msgId = msgId;
	},
	
	/**
	 * 构建 DataContent 消息模型对象
	 * @param {Object} action
	 * @param {Object} chatData
	 * @param {Object} extend
	 */
	DataContent: function(action,chatData,extend){
		this.action = action;
		this.chatData = chatData;
		this.extend = extend;
	},
	
	//保存聊天记录.
	//思路: 1. 将聊天记录按照一定的格式保存
	
	/**
	 * 保存用户的聊天记录, 以JSON格式存储List
	 * @param {Object} userId 自己的id
	 * @param {Object} friendId 朋友的id
	 * @param {Object} msg    要保存的消息
	 * @param {Object} flag	  区分消息类型, 0表示自己发的, 1表示朋友发过来的
	 */
	saveUserChatHistory: function(userId, friendId, msg, flag){
		//1. 获取自己的信息
		var user = this.getUserGlobalInfo();
		//2. 组装保存的key
		var chatKey = "chat-" +userId + "-" + friendId;
		//3. 先获取原先的聊天记录, 如果有,则为对应的列表, 如果没有,则为空列表
		var chatHistoryList = this.getUserChatHistory(userId, friendId);
		
		//4. 构建当前的聊天记录对象, new不能忘记
		var singleMsg = new this.ChatHistory(userId, friendId, msg, flag);
		//5. 追加到本来的聊天记录中
		chatHistoryList.push(singleMsg);
		//6. 将追加后的聊天记录存储到本地缓存中
		plus.storage.setItem(chatKey,JSON.stringify(chatHistoryList));
	},
	
	/**
	 * 获取指定用户和好友的聊天记录, 返回对象
	 * @param {Object} userId 用户的id
	 * @param {Object} friendId 好友的id
	 */
	getUserChatHistory: function(userId, friendId){
		// key
		var chatKey = "chat-" +userId + "-" + friendId;
		// 获取对应的聊天记录
		var chatHistoryListStr = plus.storage.getItem(chatKey);
		var chatHistoryList;
		// 判断聊天记录
		if( this.isNotNull(chatHistoryListStr) ){
			//不为空,返回对应的聊天信息
			chatHistoryList = JSON.parse(chatHistoryListStr);
		}else{
			//如果为空, 返回空数组
			chatHistoryList = [];
		}
		return chatHistoryList;
	},
	
	
	/**
	 * 删除用户与好友的聊天记录
	 * @param {Object} userId
	 * @param {Object} friendId
	 */
	delUserChatHistory: function(userId, friendId){
		// key
		var chatKey = "chat-" +userId + "-" + friendId;
		//删除记录
		plus.storage.removeItem(chatKey);
	},
	
	/**
	 * 构建,单个聊天记录的对象
	 * @param {Object} userId 自己的id
	 * @param {Object} friendId 朋友id
	 * @param {Object} msg    发送的消息
	 * @param {Object} flag   消息类型,0为自己发的,1位获取的消息
	 */
	ChatHistory: function(userId, friendId, msg, flag){
		this.userId = userId;
		this.friendId = friendId;
		this.msg = msg;
		this.flag = flag;
	},


	/**
	 * 定义聊天记录的种类,0位自己发的,1为获取的
	 */
	SENDER: 0,
	RECEVIER: 1,
	
	/**
	 * 聊天记录的快照，仅保存每次和朋友聊天的最后一条消息,追加到快照列表中
	 * @param {Object} userId
	 * @param {Object} friendId
	 * @param {Object} msg
	 * @param {Object} isRead
	 */
	saveUserChatSnapshot: function(userId, friendId, msg, isRead){
		//1. 获取自己的信息
		var user = this.getUserGlobalInfo();
		//2. 组装保存的key
		var chatKey = "chat-snapshot-" +userId;
		//3. 先获取原先的快照, 如果有,查看是否有同样的快照,有则删除后重新添加
		var chatSnapshotListStr = plus.storage.getItem(chatKey);
		var chatSnapshotList;
		
		if(this.isNotNull(chatSnapshotListStr)){
			//3.1 遍历chatSnapshotList,对有同样friendId的快照进行删除
			chatSnapshotList = JSON.parse(chatSnapshotListStr);
			for (var i = 0; i < chatSnapshotList.length; i++) {
				var snapshot = chatSnapshotList[i];
				if(snapshot.friendId == friendId){
					// 删除已经存在的friendId所对应的快照对象
					chatSnapshotList.splice(i, 1);
					break;
				}
			}
		}else{
			chatSnapshotList = [];
		}
		
		//4. 构建当前的快照对象, new不能忘记
		var singleSnapshot = new this.ChatSnapshot(userId, friendId, msg, isRead);
		//5. 追加到本来的快照中, 插入头部
		chatSnapshotList.unshift(singleSnapshot);
		//6. 将追加后的快照存储到本地缓存中
		plus.storage.setItem(chatKey,JSON.stringify(chatSnapshotList));
	},
	
	/**
	 * 获取用户快照记录列表
	 * @param {Object} userId
	 */
	getUserChatSnapshot: function(userId){
		//1. 组装保存的key
		var chatKey = "chat-snapshot-" +userId;
		// 获取对应的快照
		var chatSnapshotListStr = plus.storage.getItem(chatKey);
		var chatSnapshotList;
		// 判断快照
		if( this.isNotNull(chatSnapshotListStr) ){
			//不为空,返回对应的快照
			chatSnapshotList = JSON.parse(chatSnapshotListStr);
		}else{
			//如果为空, 返回空数组
			chatSnapshotList = [];
		}
		return chatSnapshotList;
	},
	
	/**
	 * 删除用户与好友的聊天快照
	 * @param {Object} userId
	 * @param {Object} friendId
	 */
	delUserChatSnapshot: function(userId, friendId){
		//1. 获取自己的信息
		var user = this.getUserGlobalInfo();
		//2. 组装保存的key
		var chatKey = "chat-snapshot-" +userId;
		//3. 先获取原先的快照, 如果有,查看是否有同样的快照,有则删除后重新添加
		var chatSnapshotListStr = plus.storage.getItem(chatKey);
		var chatSnapshotList;
		
		if(this.isNotNull(chatSnapshotListStr)){
			//3.1 遍历chatSnapshotList,对有同样friendId的快照进行删除
			chatSnapshotList = JSON.parse(chatSnapshotListStr);
			for (var i = 0; i < chatSnapshotList.length; i++) {
				var snapshot = chatSnapshotList[i];
				if(snapshot.friendId == friendId){
					// 删除已经存在的friendId所对应的快照对象
					chatSnapshotList.splice(i, 1);
					break;
				}
			}
		}else{
			//如果为空,不做处理
			return;
		}	
		//4. 将追加后的快照存储到本地缓存中
		plus.storage.setItem(chatKey,JSON.stringify(chatSnapshotList));
	},
	
	/**
	 * 根据用户id，从本地的缓存（联系人列表）中获取朋友的信息
	 * @param {Object} friendId
	 */
	getFriendFromContactList: function(friendId) {
		var contactListStr = plus.storage.getItem("contactList");
		//console.log("联系人列表:" + JSON.stringify(JSON.parse(contactListStr)));
		// 判断contactListStr是否为空
		if (this.isNotNull(contactListStr)) {
			// 不为空，则把用户信息返回
			var contactList = JSON.parse(contactListStr);
			for (var i = 0 ; i < contactList.length ; i++) {
				var friend = contactList[i];
				if (friend.friendId == friendId) {
					return friend;
					break;
				}
			}
		} else {
			// 如果为空，直接返回null
			return null;
		}
	},
	
	/**
	 * 标记消息为已读状态
	 * @param {Object} userId
	 * @param {Object} friendId
	 */
	readUserChatSnapshot: function(userId, friendId){
		//1. 组装保存的key
		var chatKey = "chat-snapshot-" +userId;
		// 获取对应的快照
		var chatSnapshotListStr = plus.storage.getItem(chatKey);
		var chatSnapshotList;
		// 判断快照
		if( this.isNotNull(chatSnapshotListStr) ){
			//不为空,获取对应的快照
			chatSnapshotList = JSON.parse(chatSnapshotListStr);
			// 循环这个list，判断是否存在好友，比对friendId，
			// 如果有，在list中的原有位置删除该 快照 对象，然后重新放入一个标记已读的快照对象=			
			for (var i = 0; i < chatSnapshotList.length; i++) {
				var snapshot = chatSnapshotList[i];
				if(snapshot.friendId == friendId){
					// 修改为已读状态, 替换已经存在的friendId所对应的快照对象
					snapshot.isRead = true;
					chatSnapshotList.splice(i, 1, snapshot);
					break;
				}
			}
			// 替换原有的快照列表
			plus.storage.setItem(chatKey, JSON.stringify(chatSnapshotList));
		}else{
			//如果为空,直接返回
			return;
		}

	},
	
	
	/**
	 * 快照对象
	 * @param {Object} myId
	 * @param {Object} friendId
	 * @param {Object} msg
	 * @param {Object} isRead	用于判断消息是否已读还是未读
	 */
	ChatSnapshot: function(userId, friendId, msg, isRead){
		this.userId = userId;
		this.friendId = friendId;
		this.msg = msg;
		this.isRead = isRead;
	},
	
	//客户端定时发送心跳的时间间隔（ms），默认为10s
	KEEPALIVEINTERVAL: 58000
}