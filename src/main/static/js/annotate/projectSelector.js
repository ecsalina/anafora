
function ProjectSelector(setting) {
	if(setting == undefined)
		throw "setting is undefined in ProjectSelector constructor";

	var _self = this;
	this.windowElement = $("#projectSelectorWindow");
	this.divElement = $("#projectSelector");
	this.schemaElement = $("#schemaSelector").children("div").eq(0);
	this.modeElement = $("#schemaSelector").children("div").eq(1);
	this.administratorElement = $("#schemaSelector").children("div").eq(2);
	this.mask = $("#mask");

	this.cancelBtn = this.windowElement.children("div").eq(2).children("div").eq(0);
	this.openBtn = this.windowElement.children("div").eq(2).children("div").eq(1);

	this.cancelBtn.bind('click', function() { _self.cancelBtnClick(); });

	this.administratorElement.find("ul>li").eq(0).bind('click', function(evt) {ProjectSelector.clickAdjudicationSelect(_self, evt.target);});
	this.administratorElement.find("ul>li").eq(1).bind('click', function(evt) {ProjectSelector.clickViewSelect(_self, evt.target);});

	this.projectDir = undefined;
	this.schemaMap = setting.schemaMap;
	this.adjSourceSchema = undefined;
	this.mode = undefined;
	if(setting.schema == "")
		this.schema = undefined;
	else {
		if(setting.schema.indexOf(".") >=0) {
			var t=setting.schema.split(".");
			this.schema = t[0];
			this.mode = t[1];
		}
		else {
			this.schema = setting.schema;
			this.mode = false;
		}
	}

	if(setting.isAdjudication == undefined)
		this.adjudication = false;
	else
		this.adjudication = setting.isAdjudication;
	
	if(setting.isView == undefined)
		this.view = false;
	else
		this.view = setting.isView;

	this.selected = {"project": setting.projectName, "corpus": setting.corpusName, "task": setting.taskName, "annotator": setting.annotator };
	
	this.baseURL = setting.root_url + "/" + setting.app_name + "/";
	this.initialProjectDir();
}

ProjectSelector.prototype.initialProjectDir = function() {
	var _self = this;

	this.schemaSelect();
	this.modeSelect();
	this.adjudicationSelect();
	this.viewSelect();

	if(this.projectDir == undefined) {
		this.projectDir = {};
		var projectList = this.getDir();
		$.each(projectList, function(idx, pName) {
			_self.projectDir[pName] = {};
		});
	}

	if(this.selected.project === "") {
		this.selectProject();
	}
	else {
		var corpusList = this.getDir(this.selected.project);
		$.each(corpusList, function(idx, cName) {
			_self.projectDir[_self.selected.project][cName] = null;
		});

		if(this.selected.corpus === "" || this.schema === undefined) {
			this.selectCorpus();
		}
		else {
			this.selectTask();
			this.windowElement.hide();
			this.mask.hide();
			return ;
		}
	}
	this.popup();
}

ProjectSelector.prototype.getDir = function(projectName, corpusName, schemaName, isAdjudication, isView) {
	var jsonURL = this.baseURL + "getDir/";
	if(projectName != undefined)
		jsonURL += projectName + "/";

	if(corpusName != undefined || schemaName != undefined) {
		if(corpusName == undefined || schemaName == undefined)
			throw "should provide both corpusName and schema Name";

		jsonURL += corpusName + "/" +  schemaName;
		if(isAdjudication != undefined && isAdjudication)
			jsonURL += ".Adjudication";

		if(isView != undefined && isView)
			jsonURL += "/view";

		jsonURL += "/";
	}

	var dirJSON = $.ajax({ type: "GET", url: jsonURL, cache: false, async: false, fail: function() {throw "getDir fail";}, error: function() {throw "getDir error";}}).responseText;
	var dir = $.parseJSON(dirJSON);

	return dir;
}

ProjectSelector.prototype.getAnnotator = function(projectName, corpusName, taskName, schemaName) {
	var jsonURL = this.baseURL + "annotator/";
	if(projectName == undefined)
		throw "project name is empty";
	jsonURL += (projectName + "/");

	if(corpusName == undefined)
		throw "corpus name is empty";
	jsonURL += (corpusName + "/");

	if(taskName == undefined)
		throw "task name is empty";
	jsonURL += (taskName + "/")

	if(schemaName == undefined)
		throw "schema name is empty";
	jsonURL += (schemaName + "/")

	var dirJSON = $.ajax({ type: "GET", url: jsonURL, cache: false, async: false, fail: function() {throw "get annotator fail";}, error: function() {throw "get annotator error";}}).responseText;
	var annotator = $.parseJSON(dirJSON);
	return annotator;
}

/*
ProjectSelector.prototype.getCorpusFromProjectName = function(projectName) {
	if(projectName in this.projectDir) {
		if(Object.keys(this.projectDir[projectName]).length === 0) {
			//var corpusJSON = $.ajax({ type: "GET", url: _setting.root_url + "/" + _setting.app_name + "/getDir/" + projectName + "/", cache: false, async: false}).responseText;
			//var corpusList = $.parseJSON(corpusJSON);
			var corpusList = this.getDir(projectName);
			var _self = this;
			$.each(corpusList, function(index, element) {
				_self.projectDir[projectName][element] = null;
				
			});
		}
	}

	return this.projectDir[projectName];
}
*/

/*
ProjectSelector.prototype.getTaskFromProjectCorpusName = function(projectName, corpusName) {
	var taskJSON = "";
	
*/
	/*
	if(this.adjudication) {
		var adjSrcSchemaModeList = Object.keys(_setting.schemaMap[this.schema]).sort();
		var adjIdx = adjSrcSchemaModeList.indexOf("Adjudication");
		var adjSrcSchemaMode = adjSrcSchemaModeList[(adjIdx+1) % adjSrcSchemaModeList.length];
		taskJSON = $.ajax({ type: "GET", url: _setting.root_url + "/" + _setting.app_name + "/getDir/" + projectName + "/" + corpusName + "/" + this.schema + "." + adjSrcSchemaMode + "/" + this.schema + (this.mode==undefined ? "" : "."+this.mode) + "/" , cache: false, async: false}).responseText;
	}
	else
		taskJSON = $.ajax({ type: "GET", url: _setting.root_url + "/" + _setting.app_name + "/getDir/" + projectName + "/" + corpusName + "/" + this.schema + (this.mode==undefined ? "" : "."+this.mode) + "/" , cache: false, async: false}).responseText;
	var taskList = $.parseJSON(taskJSON);
	*/
/*
	taskList = this.getDir(projectName, corpusName, this.schema, this.isAdjudication);

	return taskList;
}
*/

ProjectSelector.prototype.selectProject = function() {
	this.updateSelectMenu("Select Project" ,Object.keys(this.projectDir), ProjectSelector.clickProject);
	//this.schemaSelect();
	this.fixPosition();
	// this.popup();
}

ProjectSelector.prototype.selectCorpus = function() {
	var _self = this;
	if(Object.keys(this.projectDir[this.selected.project]).length === 0) {
		var corpusList = this.getDir(this.selected.project);
		$.each(corpusList, function(idx, cName) {
			_self.projectDir[_self.selected.project][cName] = null;
		});
	} 

	this.updateSelectMenu("Select Corpus", Object.keys(this.projectDir[this.selected.project]), ProjectSelector.clickCorpus, ProjectSelector.backToProject);
	// this.popup();
	this.fixPosition();
}


ProjectSelector.prototype.selectTask = function() {
	if(this.schema == undefined) {
		throw "Select Schema First";
	}
	else if ( this.mode !== false && this.mode === undefined ) {
		throw "Select Mode First";
	}
	else {
		var taskList = this.getDir(this.selected.project, this.selected.corpus, this.schema + ((this.mode === false || this.mode === undefined)?"":"."+this.mode) , this.adjudication, this.view, this.crossDoc);
		if(this.view)
			this.updateSelectMenu("Select Task", taskList, ProjectSelector.clickTaskWithView, ProjectSelector.backToCorpus);
		else
			this.updateSelectMenu("Select Task", taskList, ProjectSelector.clickTask, ProjectSelector.backToCorpus);
		// this.popup();
 	}

	this.fixPosition();
}

ProjectSelector.prototype.selectAnnotator = function() {
	if(this.schema == undefined) {
		throw "Select Schema First";
	}
	else if ( this.mode !== false && this.mode === undefined ) {
		throw "Select Mode First";
	}
	else {
		var annotatorList = this.getAnnotator(this.selected.project, this.selected.corpus, this.selected.task, this.schema + ((this.mode === false || this.mode === undefined)?"":"."+this.mode) + ((this.adjudication === false || this.adjudication === undefined)?"":".Adjudication"));
		this.updateSelectMenu("Select Annotator", annotatorList, ProjectSelector.clickAnnotator, ProjectSelector.backToTask);
	}
	
}

ProjectSelector.prototype.selectComplete = function() {
	var _self = this;
	this.openBtn.bind('click', function() { _self.openNewProject(); } );
	this.openBtn.removeClass().addClass("btnEnable");
	
}
ProjectSelector.prototype.cancelBtnClick = function() {
	if(_setting.projectName != "" && _setting.corpusName != "" && _setting.taskName != "") {

		this.windowElement.hide();
		this.mask.hide();
	}
	else {
		;
	}
}
ProjectSelector.prototype.openNewProject = function() {
	if(this.selected.project == "" || this.selected.corpus == "" || this.selected.task == "" || this.schema == undefined)
		throw "openNewProject error: required selected project, corpus, task or schema";

	
	window.location = this.baseURL + this.selected.project + "/" + this.selected.corpus + "/" + this.selected.task + "/" + this.schema + (this.mode === false || this.mode===undefined ?  "" : "."+this.mode) + (this.adjudication ? ".Adjudication" : "" ) +  "/" + ((this.view != undefined && this.view) ? this.selected.annotator : "") ;
}

ProjectSelector.clickProject = function(_self, target ) {
	_self.selected.project = target.innerHTML;
	_self.selectCorpus();
	_self.popup();
}

ProjectSelector.clickCorpus = function(_self, target ) {
	var idx = _self.divElement.children("ul").children("li").index(target);
	_self.selected.corpus = target.innerHTML;
	try{
		_self.selectTask();
		_self.popup();
	}
	catch(err) {
		_self.selected.corpus = "";
		throw err;
	}
}

ProjectSelector.clickTask = function(_self, target ) {
	_self.divElement.find("li").removeClass();
	_self.selected.task = target.innerHTML;
	$(target).addClass("selected");	
	_self.selectComplete();
	_self.popup();
}

ProjectSelector.clickTaskWithView = function(_self, target ) {
	_self.selected.task = target.innerHTML;
	$(target).addClass("selected");	
	_self.selectAnnotator();
	_self.popup();
}

ProjectSelector.prototype.clickNextTask = function(_self) {
	/** Collects the list of all documents ("tasks") sorts them alphabetically,
	 *  finds the current documents in the list, selects the next document,
	 *  and opens the next document as a new project.
	 */
	var taskList = _self.getDir(_self.selected.project, _self.selected.corpus, _self.schema + ((_self.mode === false || _self.mode === undefined)?"":"."+_self.mode) , _self.adjudication, _self.view);
	taskListArray = taskList.n.concat(taskList.i, taskList.c).sort();
	currentTaskIndex = taskListArray.indexOf(_self.selected.task);
	nextTask = taskListArray[++currentTaskIndex];
	_self.selected.task = nextTask;
	_self.openNewProject();
}

ProjectSelector.prototype.clickPrevTask = function(_self) {
	/** Same as clickNext, but retrieves the previous document.
	 */
	console.log(_self.task) //DEBUG
	var taskList = _self.getDir(_self.selected.project, _self.selected.corpus, _self.schema + ((_self.mode === false || _self.mode === undefined)?"":"."+_self.mode) , _self.adjudication, _self.view);
	taskListArray = taskList.n.concat(taskList.i, taskList.c).sort();
	currentTaskIndex = taskListArray.indexOf(_self.selected.task);
	prevTask = taskListArray[--currentTaskIndex];
	_self.selected.task = prevTask;
	_self.openNewProject();
}

ProjectSelector.clickAnnotator = function(_self, target) {
	_self.selected.annotator = target.innerHTML;
	$(target).addClass("selected");
	_self.selectComplete();
	_self.popup();
}

ProjectSelector.backToProject = function(_self) {
	try {
		_self.selectProject();
	}
	catch(err) {
		_self.selected.project = "";
		throw err;
	}
}

ProjectSelector.backToCorpus = function(_self, target) {
	_self.selected.corpus = "";
	try {
		_self.selectCorpus();
	}
	catch(err) {
		throw err;
	}
}

ProjectSelector.backToTask = function(_self, target) {
	_self.selected.task = "";
	try {
		_self.selectTask();
	}
	catch(err) {
		throw err;
	}
}

ProjectSelector.prototype.updateSelectMenu = function(title, itemList, callback, previousCallback) {
	this.divElement.children("h4").text(title);
	var rStr = "";
	var _self = this;

	if(itemList instanceof Array) {
		// update project and corpus
		$.each(itemList, function() {
			rStr += "<li>" + this + "</li>";
		});
		this.divElement.children("div:first").children("ul").html(rStr);
		this.divElement.children("div:first").find("li").bind('click', function(evt) {
		try{callback(_self, evt.target);}catch(err){alert(err);throw err;}});

		this.divElement.children("div").eq(1).hide();
		this.divElement.children("div").eq(2).hide();
	}
	else {
		// update new and completeddtask
		//// new task
		this.divElement.children("div").eq(0).children("h5").text("New Tasks");
		$.each(itemList.n, function() {
			rStr += "<li>" + this + "</li>";
		});

		this.divElement.children("div").eq(0).children("ul").html(rStr);

		//// In-progress task
		rStr = "";
		this.divElement.children("div").eq(1).children("h5").text("In-progress Tasks");
		$.each(itemList.i, function() {
			rStr += "<li>" + this + "</li>";
		});
		this.divElement.children("div").eq(1).children("ul").html(rStr);
		this.divElement.children("div").eq(1).show();

		//// complete task
		rStr = "";
		this.divElement.children("div").eq(2).children("h5").text("Completed Tasks");
		$.each(itemList.c, function() {
			rStr += "<li>" + this + "</li>";
		});

		this.divElement.children("div").eq(2).children("ul").html(rStr);
		this.divElement.children("div").eq(2).show();

		this.divElement.children("div").find("li").bind('click', function(evt) {
		callback(_self, evt.target);});
		this.divElement.children("div").children("h5").show();
	}

	if(previousCallback != undefined) {
		this.divElement.children("div:first").children("ul").prepend("<li>&#8592; Back</li>");
		this.divElement.children("div:first").children("ul").find("li").first().bind('click', function(evt) {
		try{previousCallback(_self, evt.target);}catch(err){alert(err);throw err;}});
	}
}

ProjectSelector.clickSchemaSelect = function(_self, target) {
	_self.schema = target.innerHTML;
	_self.schemaSelect();

	if(_self.schemaMap[_self.schema] == 0)
		_self.mode = false;
	else {
		_self.mode = undefined;
		_self.modeSelect();
	}
	
}

ProjectSelector.clickSchemaReselect = function(_self) {
	_self.schema = undefined;
	_self.schemaSelect();

	_self.mode = undefined;
	_self.modeElement.hide();
}

ProjectSelector.clickModeSelect = function(_self, target) {
	_self.mode = target.innerHTML;
	_self.modeSelect();
}

ProjectSelector.clickModeReselect = function(_self, target) {
	_self.mode = undefined;
	_self.modeSelect();
}

ProjectSelector.clickAdjudicationSelect = function(_self, target) {
	_self.adjudication = !_self.adjudication;
	_self.adjudicationSelect();
}

ProjectSelector.clickViewSelect = function(_self, target) {
	_self.view = !_self.view;
	_self.viewSelect();
}
/*
ProjectSelector.clickAdjudicationReelect = function(_self, target) {
	_self.adjudication = false;
	_self.adjudicationSelect();
}
*/
ProjectSelector.prototype.modeSelect = function() {
	var _self = this;
	if(this.schema != undefined && this.mode !== false) {
		if(this.mode == undefined) {
			var modeStr = "";
			for(var idx in this.schemaMap[this.schema]) {
				if((typeof this.schemaMap[this.schema][idx]) == "string") {
					modeStr += "<li>" + this.schemaMap[this.schema][idx] + "</li>";
				}
			}
			this.modeElement.children("ul").html(modeStr);

			this.modeElement.find("li").bind("click", function(evt) { ProjectSelector.clickModeSelect(_self, evt.target); });
		}
		else {
			this.modeElement.children("ul").html('<li class="selected">' + this.mode + "</li>");
			this.modeElement.find("li").bind("click", function(evt) { ProjectSelector.clickModeReselect(_self); });
		}
		this.modeElement.show();
		this.popup();
	}
	else
		this.modeElement.hide();

	this.fixPosition();
}

ProjectSelector.prototype.schemaSelect = function() {
	var _self = this;
	if(this.schema == undefined) {
		var schemaStr = "";
		for(var schemaName in this.schemaMap) {
			schemaStr += "<li>" + schemaName + "</li>";
		}
		this.schemaElement.children("ul").html(schemaStr);
		this.schemaElement.find("li").bind("click", function(evt) {ProjectSelector.clickSchemaSelect(_self, evt.target);});
		this.modeElement.hide();
	}
	else {
		this.schemaElement.children("ul").html('<li class="selected">' + this.schema + "</li>");
		this.schemaElement.find("li").bind("click", function(evt) {ProjectSelector.clickSchemaReselect(_self);});

	}
	this.fixPosition();
}

ProjectSelector.prototype.adjudicationSelect = function() {
	var _self = this;
	if(this.adjudication) {
		this.administratorElement.find("ul>li").eq(0).addClass("selected");
	}
	else {
		this.administratorElement.find("ul>li").eq(0).removeClass("selected");

	}
}

ProjectSelector.prototype.viewSelect = function() {
	var _self = this;
	if(this.view) {
		this.administratorElement.find("ul>li").eq(1).addClass("selected");
	}
	else {
		this.administratorElement.find("ul>li").eq(1).removeClass("selected");

	}
}

ProjectSelector.prototype.fixPosition = function() {
	var popMargTop = (this.windowElement.height()) / 2;
	var popMargLeft = (this.windowElement.width()) / 2;
	this.windowElement.css({ 
			'margin-top' : -popMargTop,
			'margin-left' : -popMargLeft
	});
}

ProjectSelector.prototype.popup = function() {
	this.windowElement.fadeIn(300);
	this.mask.fadeIn(300);
}
