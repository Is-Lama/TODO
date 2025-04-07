(function() {
  // создаем и возвращаем заголовок приложения
  function createAppTitle(title) {
    let appTitle = document.createElement('h2');
    appTitle.innerHTML = title;
    return appTitle;
  }

  // создаем и возвращаем форму для создания дела
  function createTodoItemForm() {
    let form = document.createElement('form');
    let input = document.createElement('input');
    let buttonWrapper = document.createElement('div');
    let button = document.createElement('button');

    form.classList.add('input-group', 'mb-3');
    input.classList.add('form-control');  
    input.placeholder = 'Введите название новой задачи';
    buttonWrapper.classList.add('input-group-append');
    button.classList.add('btn', 'btn-primary');
    button.textContent = 'Добавить задачу';
    button.disabled = true;    

    buttonWrapper.append(button);
    form.append(input);
    form.append(buttonWrapper);

    return {
      form,
      input,
      button,
    };
  }

  // создаем и возвращаем список элементов
  function createTodoList() {
    let list = document.createElement('ul');
    list.classList.add('list-group');
    return list;
  }

  function createTodoItemElement(todoItem, { onDone, onDelete }) {
    const doneClass = 'list-group-item-success';
    
    let item = document.createElement('li');

    // кнопки помещаем в элемент, который красиво покажет их в одной группе
    let buttonGroup = document.createElement('div');
    let doneButton = document.createElement('button');
    let deleteButton = document.createElement('button');

    // устанавливаем стили для элемента списка, а также для размещения кнопок
    // в его правой части с помощью flex
    item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
    if (todoItem.done) {
      item.classList.add(doneClass)
    }
    item.textContent = todoItem.name;

    buttonGroup.classList.add('btn-group', 'btn-group-sm');
    doneButton.classList.add('btn', 'btn-success');
    doneButton.textContent = 'Готово';
    deleteButton.classList.add('btn', 'btn-danger');
    deleteButton.textContent = 'Удалить';

    // добавляем обработчики на кнопки
    doneButton.addEventListener('click', function() {
      onDone({ todoItem, element: item });
      item.classList.toggle(doneClass, todoItem.done);
    });
    deleteButton.addEventListener('click', function() {
      onDelete({ todoItem, element: item });      
    });

    // вкладываем кнопки в отдельный элемент, чтобы они объединились в один блок
    buttonGroup.append(doneButton);
    buttonGroup.append(deleteButton);
    item.append(buttonGroup);    
    return item;
  }

  async function createTodoApp(container, title, owner) {
    let todoAppTitle = createAppTitle(title);
    let todoItemForm = createTodoItemForm();
    let todoList = createTodoList();
    const handlers = {
      onDone({ todoItem }) {
        todoItem.done = !todoItem.done;
        fetch(`http://localhost:3000/api/todos/${todoItem.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ done: todoItem.done }),
          headers: {
            'Content-Type': 'application/json',
          }
        });
      },
      onDelete({ todoItem, element }) {
        if (!confirm('Вы уверены?')) {
          return;
        }
        element.remove();
        fetch(`http://localhost:3000/api/todos/${todoItem.id}`, {
          method: 'DELETE',
        });
      },
    };

    container.append(todoAppTitle);
    container.append(todoItemForm.form);
    container.append(todoList);

    // Отправляем запрос на список всех дел
    const response = await fetch(`http://localhost:3000/api/todos?owner=${owner}`);
    const todoItemList = await response.json();

    todoItemList.forEach(todoItem => {
      const todoItemElement = createTodoItemElement(todoItem, handlers);
      todoList.append(todoItemElement);
    });

    todoItemForm.input.addEventListener('input', function(e) {
        todoItemForm.button.removeAttribute('disabled');
      });  
    
    // браузер создает событие submit на форме по нажатию на enter или на кнопку создания дела
    todoItemForm.form.addEventListener('submit', async e => {
      // эта строчка необходима, чтобы предотвратить стандартное действие браузера
      // в данном случае мы не хотим, чтобы страница перезагружалась при отправке формы
      e.preventDefault();

      // игнорируем создание элемента, если пользователь ничего не ввел в  поле
      if (!todoItemForm.input.value) {        
        return;
      }

      const response = await fetch('http://localhost:3000/api/todos', {
        method: 'POST',
        body: JSON.stringify({
          name: todoItemForm.input.value.trim(),
          owner,
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const todoItem = await response.json();
          
      let todoItemElement = createTodoItemElement(todoItem, handlers);
      
      // создаем и добавляем в список новое дело с названием из поля для ввода
      todoList.append(todoItemElement);
      
      // обнуляем значение в поле, чтобы не пришлось стирать его вручную
      todoItemForm.input.value = '';
      todoItemForm.button.disabled = true; 
    });
  }

  window.createTodoApp = createTodoApp;
     
})();
