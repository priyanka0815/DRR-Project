document.addEventListener("DOMContentLoaded", function () {
	const popup = document.querySelector("#popup"),
		popup_form = popup.querySelector("form"),
		msg = popup_form.querySelector(".msg"),
		startDate = popup_form.start_date,
		endDate = popup_form.end_date,
		excluded_date = popup_form.excluded_date,
		lead_count = popup_form.lead_count,
		expected_drr = popup_form.expected_drr,
		openPopupBtn = document.querySelector("#open-popup"),
		recordtable = document.querySelector("table"),
		temp = recordtable.querySelector("table .template");
	results = JSON.parse(localStorage.getItem("records")) || [];

	window.addEventListener("displayRecords", processRecord);
	window.dispatchEvent(new Event("displayRecords"));

	//configuring date picker
	flatpickr(startDate, {
		dateFormat: "d-m-Y",
	});
	flatpickr(endDate, {
		dateFormat: "d-m-Y",
	});
	flatpickr(excluded_date, {
		dateFormat: "d-m-Y",
		mode: "multiple",
	});

	startDate.addEventListener("change", () => {
		// setting min value to end date
		endDate._flatpickr.set("minDate", startDate.value);

		// setting min value to excluded date
		excluded_date._flatpickr.set("minDate", startDate.value);
	});

	endDate.addEventListener("input", () => {
		// setting max value to start date
		startDate._flatpickr.set("maxDate", endDate.value);

		// setting max value to excluded date
		excluded_date._flatpickr.set("maxDate", endDate.value);
	});

	popup_form.addEventListener("submit", function (e) {
		e.preventDefault();
		let isFieldEmpty = false;
		popup_form.querySelector("[type=submit]").disabled = true;
		document.querySelector(".msg").innerHTML = ""; //resetting msg field

		const formData = new FormData(popup_form);
		iterator = formData.keys();

		// checking for empty field
		let obj = iterator.next();
		while (!obj.done) {
			if (formData.get(obj.value).trim() == "") {
				isFieldEmpty = true;
				break;
			}
			obj = iterator.next();
		}

		if (isFieldEmpty) {
			popup_form.querySelector("[type=submit]").removeAttribute("disabled");
			msg.innerHTML = "All Fields are required";
			return;
		}

		// creating xhr object
		const xhr = new XMLHttpRequest();
		var url = "get_data.php";
		xhr.open("POST", url, true);

		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		xhr.onreadystatechange = function () {
			if (xhr.readyState == 4 && xhr.status == 200) {
				alert(xhr.responseText);
			}

			// adding results to array for testing
			if (xhr.readyState == 4) {
				// storing result to array
				results.push({
					id: results[results.length - 1]?.id + 1 || 1,
					start_date: startDate._flatpickr.selectedDates[0],
					end_date: endDate._flatpickr.selectedDates[0],
					excluded_date: excluded_date._flatpickr.selectedDates,
					lead_count: lead_count.value,
					last_updated: new Date(),
				});

				localStorage.setItem("records", JSON.stringify(results));
				window.dispatchEvent(new Event("displayRecords"));
			}
		};

		xhr.onerror = function () {};

		xhr.send(formData);

		popup.dispatchEvent(new Event("close"));
		popup_form.querySelector("[type=submit]").removeAttribute("disabled");
	});

	// close button
	popup.querySelectorAll(".close").forEach((close) => {
		close.addEventListener("click", () => popup.dispatchEvent(new Event("close")));
	});

	// open popup
	openPopupBtn.addEventListener("click", function () {
		popup.classList.add("active");
	});

	// handle popup close
	popup.addEventListener("close", function () {
		popup.classList.remove("active");
		setTimeout(function () {
			popup_form.reset();
			startDate._flatpickr.clear();
			endDate._flatpickr.clear();
			excluded_date._flatpickr.clear();
		}, 1500);
	});

	// display records on screen
	function processRecord() {
		recordtable.querySelector("tbody").innerHTML = "";

		if (results.length == 0) {
			recordtable.querySelector("tbody").innerHTML = "<td id='error' colspan='10'>NO RECORD AVAILABLE</td>";
			return;
		}

		results.forEach((row) => {
			const newRecord = cloneNode(temp);

			newRecord.classList.remove("template");
			newRecord.style.removeProperty("display");

			const noOfDays =
				(new Date(row.end_date) - new Date(row.start_date)) / (1000 * 60 * 60 * 24) +
				1 -
				row.excluded_date.length;

			newRecord.querySelector(".id").innerHTML = row.id;
			newRecord.querySelector(".start_date").innerHTML = flatpickr.formatDate(new Date(row.start_date), "d-m-Y");
			newRecord.querySelector(".end_date").innerHTML = flatpickr.formatDate(new Date(row.end_date), "d-m-Y");
			newRecord.querySelector(".month_year").innerHTML = flatpickr.formatDate(new Date(row.start_date), "m-Y");
			newRecord.querySelector(".excluded_date").innerHTML = row.excluded_date
				.map((date) => flatpickr.formatDate(new Date(date), "d-m-Y"))
				.join(", ");
			newRecord.querySelector(".no_of_day").innerHTML = noOfDays;
			newRecord.querySelector(".lead_count").innerHTML = row.lead_count;
			newRecord.querySelector(".expected_drr").innerHTML = Math.round(row["lead_count"] / noOfDays);

			newRecord.querySelector(".last_updated").innerHTML = flatpickr.formatDate(
				new Date(row.last_updated),
				"d-m-Y H:i:s"
			);

			recordtable.querySelector("tbody").append(newRecord);
		});
	}
});

function cloneNode(node) {
	const newNode = node.cloneNode();
	let childs = node.childNodes;

	childs.forEach((elem) => {
		newNode.append(cloneNode(elem));
	});

	return newNode;
}
