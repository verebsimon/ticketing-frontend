import { reactive } from 'vue';

const state = reactive({
	list: []
});

export function useNotification() {
	
	const showNotification = (message, type = 'success') => {
		const id = Date.now();
		
		// 1. Push the new item
		state.list.push({id, message, type});
		
		// 2. Use splice inside the timer to surgically remove the item by index
		setTimeout(() => {
			const index = state.list.findIndex(n => n.id === id);
			if(index !== -1) {
				state.list.splice(index, 1);
			}
		}, 4000);
	};
	
	const dismissNotification = (id) => {
		const index = state.list.findIndex(n => n.id === id);
		if(index !== -1) {
			state.list.splice(index, 1);
		}
	};
	
	return {
		notifications: state.list,
		showNotification,
		dismissNotification
	};
}
