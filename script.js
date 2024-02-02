//используем ключи для именования столбцов, значения для обращения к объекту
const headerMap = new Map([
  ["Имя (firstName)", "firstName"],
  ["Фамилия (lastName)", "lastName"],
  ["Описание (about)", "about"],
  ["Цвет глаз (eyeColor)", "eyeColor"],
]);
//так как данные представлены в таблице в виде названия цвета, а получаем мы значение в формате rgb(x,x,x)
//используем данную структуру для вывода названия в форме редактирования
const colorMap = {
  "255,0,0": "red",
  "0,128,0": "green",
  "0,0,255": "blue",
  "165,42,42": "brown",
  "0,0,0,0": "white",
};

let sorted = true; // для реализации сортировки по возрастанию, убыванию (при первом клике по возрастанию, при повторном по убыванию)
let dataFromJSON = []; //храним тут данные, полученные из JSONа, производим манипуляции с этим массивом
const INDEX_OF_ABOUT = 2;
const INDEX_OF_EYE = 3;
let sortedColumn = ""; //информация о столбце, который сортировался
//номер начальной страницы и кол-во выводимых записей на 1 странице
let currentPage = 1;
const recordsPerPage = 10;

//получаем контейнер и создаем контейнер для реализации функционала скрытия/показа колонок
const container = document.querySelector(".container");
const checkBoxContainer = document.createElement("div");
checkBoxContainer.setAttribute("id", "checkBoxContainer");
container.appendChild(checkBoxContainer);

const getValueByKey = (obj, key) => {
  // Проверяем, содержится ли значение непосредственно в объекте или в подобъекте name
  return key in obj ? obj[key] : obj.name[key];
};
// обновление таблицы
const updateTable = () => {
  //удаляем таблицу и создаем с измененными данными
  let table = document.querySelector("table");
  container.removeChild(table);
  table = createTable(dataFromJSON, currentPage);
  container.appendChild(table);
  //при обновление вызываем функцию повторно,чтобы отобразилась не вся таблица,
  //а та часть, которая была выбрана пользователем ранее, при работе с checkboxами
  hideShowColumn();
};
// сортировка по столбцам
const sortData = (columnName) => {
  return function () {
    const sortColumn = headerMap.get(columnName); //получаем название свойства в объекте из названия столбца
    if (sortedColumn !== sortColumn) sorted = true; //если сортируем столбец, который не сортировали до этого, производим сортировку по возрастанию
    dataFromJSON.sort((a, b) => {
      //получаем значения в зависимости от их вложенности
      let valueA = getValueByKey(a, sortColumn);
      let valueB = getValueByKey(b, sortColumn);
      if (sorted) {
        //по возрастанию
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        //по убыванию
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
    updateTable();
    sortedColumn = sortColumn;
    sorted = !sorted;
  };
};
// создание таблицы
const createTable = (data, page) => {
  //создаем необходимые элементы для таблицы
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");
  const theadRow = document.createElement("tr");

  table.setAttribute("class", "table");
  thead.setAttribute("class", "thead");

  //именуем столбцы в таблице
  if (data.length > 0) {
    for (let item of headerMap.keys()) {
      const th = document.createElement("th");

      th.textContent = item;
      //вешаем обработчик события, при клике по столбцу в шапке, сортируется столбец
      th.addEventListener("click", sortData(item));
      theadRow.appendChild(th);
    }
    thead.appendChild(theadRow);
  }
  //получаем диапазон данных для отображения на странице
  const startIndex = (page - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const pageData = data.slice(startIndex, endIndex);

  pageData.forEach((item) => {
    //получаем данные для каждой строки
    const {
      name: { firstName, lastName },
      about,
      eyeColor,
    } = item;

    const tr = document.createElement("tr");
    tr.addEventListener("click", createForm);
    // Добавляем ячейки для каждого поля
    [firstName, lastName, about, eyeColor].forEach((text, item) => {
      const td = document.createElement("td");
      if (item == INDEX_OF_EYE) {
        //в колонке предоставляем данные в виде цвета
        td.style.backgroundColor = text;
      } else {
        td.textContent = text; //текстовый вывод данных
        if (item === INDEX_OF_ABOUT) td.setAttribute("class", "about"); //добавляем класс для блока about с целью отображать данные в 2 строки,
        // остальное обрезаем многоточием (реализация в style.css)
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
  //создаем элементы для пагинации
  const paginationContainer = document.createElement("div");
  const prevBtn = document.createElement("button");
  const nextBtn = document.createElement("button");
  paginationContainer.appendChild(prevBtn);
  paginationContainer.appendChild(nextBtn);
  paginationContainer.setAttribute("id", "pagination");
  prevBtn.textContent = "Назад";
  nextBtn.textContent = "Вперед";
  //если находимся на первой странице, то кнопку "Назад" делаем неактивной, если на последней - кнопку "Вперед"
  if (currentPage === 1) prevBtn.disabled = true;
  if (Math.ceil(dataFromJSON.length / recordsPerPage) === currentPage)
    nextBtn.disabled = true;
  //обработчики события для перехода между страницами
  prevBtn.addEventListener("click", paginationTable);
  nextBtn.addEventListener("click", paginationTable);
  // Собираем таблицу
  table.appendChild(thead);
  table.appendChild(tbody);
  table.appendChild(paginationContainer);

  return table;
};
// логика пагинации
const paginationTable = (event) => {
  //в зависимости от нажатой кнопки переходим между данными
  if (event.currentTarget.textContent === "Назад") currentPage--;
  else currentPage++;
  //перерисовка таблицы с набором данных в зависимости от страницы
  updateTable();
};
const rgbToColorName = (rgb) => {
  const rgbArray = rgb.match(/\d+/g).map(Number); // Преобразует строку rgb в массив чисел
  const colorKey = rgbArray.join(","); //преобразуем в строку
  return colorMap[colorKey] || null;
};
// создание формы редактирования
const createForm = (event) => {
  //проверяем имеется ли открытая форма на странице, если да, закрываем
  let existForm = container.querySelector("#form");
  if (!!existForm) closeForm();

  //получаем номер строки, которая была выбрана для редактирования
  const editableElem = event.currentTarget;
  const rowIndex = editableElem.rowIndex;
  //создаем форму
  const form = document.createElement("div");
  form.setAttribute("id", "form");

  //получаем данные о цвете в блоке eyeColor в формате rgb
  const backgroundColor = getComputedStyle(
    editableElem.lastChild
  ).backgroundColor;

  const colorName = rgbToColorName(backgroundColor); //получаем значение в текстовом виде (название цвета)
  const rowData = Array.from(editableElem.cells).map((td) => td.textContent); //получаем значения строки, которую пользователь выбрал для редактирования

  //создаем элементы для редактирования данных
  rowData.forEach((field, index) => {
    let input;
    //в блоке about создаем textarea с целью отображения данных на нескольких строках
    if (index === INDEX_OF_ABOUT) input = document.createElement("textarea");
    else {
      input = document.createElement("input");
    }
    //присваиваем текстовое значение, полученное на основе цвета блока
    if (index === INDEX_OF_EYE) input.value = colorName;
    else input.value = field;
    form.appendChild(input);
    form.appendChild(document.createElement("br"));
  });
  //работа с кнопками "Сохранить", "Закрыть"
  const saveButton = document.createElement("button");
  saveButton.textContent = "Сохранить";
  saveButton.addEventListener("click", () => {
    const inputValues = form.querySelectorAll("input");
    const textareaValue = form.querySelector("textarea");
    //заменяем значения в массиве на значения в форме редактирования
    dataFromJSON[rowIndex - 1].name.firstName = inputValues[0].value;
    dataFromJSON[rowIndex - 1].name.lastName = inputValues[1].value;
    dataFromJSON[rowIndex - 1].about = textareaValue.value;
    dataFromJSON[rowIndex - 1].eyeColor = inputValues[2].value;
    //закрываем форму и обновляем таблицу с измененнными данными
    closeForm();
    updateTable();
  });
  //Реализация закрытия формы, в случае, если пользователь не хочет что-то изменять
  const closeButton = document.createElement("button");
  closeButton.textContent = "Закрыть";
  closeButton.addEventListener("click", () => closeForm());
  //добавление элементов в форму и формы в общий контейнер
  form.appendChild(saveButton);
  form.appendChild(closeButton);
  container.appendChild(form);
};
// закрытие формы редактирования
const closeForm = () => {
  const form = document.querySelector("#form");
  container.removeChild(form);
};
//отрисовка блока с показом/скрытие столбцов
const columnVisibilityBlock = () => {
  const table = document.querySelector("table");
  //получаем  шапку таблицы
  const headerColumn = table.querySelector("thead tr");
  //в зависимости от количество столбцов создаем checkboxы для каждого столбца по 1
  for (let i = 0; i < headerColumn.childNodes.length; i++) {
    const checkBox = document.createElement("input");
    checkBox.type = "checkbox";
    //навешиваем обработчик события, предназначенный для скрытия/показа столбца
    checkBox.addEventListener("change", hideShowColumn);
    checkBoxContainer.appendChild(checkBox);
  }
};
const hideShowColumn = () => {
  const table = container.querySelector("table");
  //получаем все строки из таблицы
  const rows = table.querySelectorAll("tr");
  //получаем checkboxы
  const checkBoxes = checkBoxContainer.querySelectorAll("input");
  const arrCheckBoxValues = []; //храним состояния чекбоксов
  //заполняем массив
  checkBoxes.forEach((item) => {
    arrCheckBoxValues.push(item.checked);
  });

  arrCheckBoxValues.forEach((item, index) => {
    //если checkbox нажат (есть галочка)
    if (item) {
      rows.forEach((row) => {
        const cell = row.children[index]; //берем родительский индекс, что позволяет нам получить все значения относительно столбца
        cell.style.display = "none"; //скрываем значения
      });
    } else {
      //если галочки нет
      rows.forEach((row) => {
        const cell = row.children[index];
        cell.style.display = ""; //показываем значения
      });
    }
  });
};
//получаем данные из json
fetch("data.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    dataFromJSON = data;
    //создаем таблицу на основе полученных данных и с учетом пагинации
    const table = createTable(dataFromJSON, currentPage);
    container.appendChild(table);
    //отрисовываем блок с checkBoxами именно тут, так как они создаются 1 раз, на основе данных полученных
    //из json (кол-во checkboxов) и не подразумевается их дальшее удаление или повторное создание
    columnVisibilityBlock();
  })
  .catch((error) => {
    console.error("Ошибка: ", error);
  });
