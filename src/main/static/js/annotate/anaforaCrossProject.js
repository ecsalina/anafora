function AnaforaCrossProject(schema, annotatorName, task) {
	AnaforaProject.call(this, schema, annotatorName, task);
	this.projectList = undefined;
	this.subTaskNameList = undefined;
	this.subTaskCharLength = undefined;
}

AnaforaCrossProject.prototype = new AnaforaProject();
AnaforaCrossProject.prototype.constructor = AnaforaCrossProject;

AnaforaCrossProject.prototype.addAnaforaProjectList = function(projectList) {
	this.projectList = projectList;

	var _self = this;

	if(projectList == undefined)
		return ;
}

AnaforaCrossProject.getXML = function(successFunc, setting, annotator, isAdjudication, subTaskName) {
	$.ajax({ type: "GET", url: setting.root_url + "/" + setting.app_name + "/xml/" + setting.projectName + "/" + setting.corpusName + "/" + setting.taskName  + "/" + setting.schema + (isAdjudication == undefined ? ( setting.isAdjudication ? ".Adjudication" : "" ) : ( isAdjudication ? ".Adjudication" : "")) + "/" + (annotator==undefined ? (setting.annotator == setting.remoteUser ? "" :(setting.annotator + "/") ) : (annotator + "/")) + ( subTaskName == undefined ? "" : "_sub_" + subTaskName + "/" ), success: successFunc, cache: false, async: false, statusCode: {403: function() {throw "Permission Deny"; }, 404: function() { ;} }});
}

AnaforaCrossProject.prototype.updateAllFrameFragement = function() {
	var _self = this;
	$.each(this.projectList, function(subTaskName, aProject) {
		aProject.updateAllFrameFragement();
	});
}

AnaforaCrossProject.prototype.getAnnotateFrameByTaskName = function(taskName) {
	if(taskName in this.projectList)
		return this.projectList[taskName].annotateFrame;
	return undefined;
}

AnaforaCrossProject.prototype.getAnnotateFrame = function(aObj) {
	var lastIdx = aObj.id.lastIndexOf('@');
	var subTaskName = aObj.id.substring(aObj.id.lastIndexOf('@', lastIdx-1) + 1, lastIdx);
	if(subTaskName in this.projectList)
		return this.projectList[subTaskName].annotateFrame;
	return undefined;
}

AnaforaCrossProject.prototype.getNewEntityId = function(taskName) {
	return this.projectList[taskName].getNewEntityId();
}

AnaforaCrossProject.prototype.getNewRelationId = function(taskName) {
	return this.projectList[taskName].getNewRelationId();
}

AnaforaCrossProject.prototype.getXMLEntityList = function() {
	var rStr;
	rStr = AnaforaProject.prototype.getXMLEntityList.call(this);
	$.each(this.projectList, function(subTaskName, aProject) {
		rStr += aProject.getXMLEntityList();
	});

	return rStr;
}

AnaforaCrossProject.prototype.getXMLRelationList = function() {
	var rStr;
	rStr = AnaforaProject.prototype.getXMLRelationList.call(this);
	$.each(this.projectList, function(subTaskName, aProject) {
		rStr += aProject.getXMLRelationList();
	});

	return rStr;
}

AnaforaCrossProject.prototype.readFromXMLDOM = function(xml, subTaskNameList, annotateFrameDivList) {
	var xmlDOM = $(xml);
	var infoDOM = xmlDOM.find("info");
	this.completed = (infoDOM.find("progress").text() == "completed");
	var schemaDOM = xmlDOM.find("schema");
	var annotationDOM = xmlDOM.find("annotations");
	var _self = this;
	this.projectList = {};
	$.each(subTaskNameList, function(sTaskIdx, subTaskName) {
		_self.projectList[subTaskName] = new AnaforaProject(_self.schema, _self.annotator, subTaskName);
		_self.projectList[subTaskName].setParentProject(_self);
		
	});

	$(annotationDOM).children().each( function() {
		var id = this.getElementsByTagName("id")[0].childNodes[0].nodeValue;
		var aObj = undefined;
		if(this.tagName == "entity") {
			aObj = Entity.genFromDOM(this, _self.schema);
		}
		else if(this.tagName == "relation") {
			aObj = Relation.genFromDOM(this, _self.schema);
		}
		else {
			throw new ErrorException("XML Wrong format: " + this.tagName );
		}

		_self.addTypeCount(aObj.type);
		var taskName = aObj.getTaskName();
		var targetAProject = undefined;
		if(taskName == _self.task) {
			targetAProject = _self;
		}
		else if(taskName in _self.projectList) {
			targetAProject = _self.projectList[taskName];
		}
		else {
			throw new ErrorException("Task name ''" + taskName + "'' not exist");
		}
		if(aObj instanceof Entity) {
			targetAProject.entityList[aObj.sID] = aObj;
		}
		else {
			targetAProject.relationList[aObj.sID] = aObj;
		}
	});


	$.each($.map(this.projectList, function(value, key) {return value;}).concat([_self]), function(aIdx, aProject) {

		aProject.maxEntityIdx = Object.keys(aProject.entityList).max();
		aProject.maxRelationIdx = Object.keys(aProject.relationList).max();

		if(aProject.maxEntityIdx == -Infinity)
			aProject.maxEntityIdx = 0;

		if(aProject.maxRelationIdx == -Infinity)
			aProject.maxRelationIdx = 0;

		if(aProject != _self) {
			aProject.setAnnotateFrame(new AnnotateFrame($(annotateFrameDivList[aProject.task]), _setting, $(annotateFrameDivList[aProject.task]).text()));
			// update link
			$.each(aProject.entityList, function(eIdx, entity) {
				aProject.updateLinking(entity.type, entity);
				aProject.annotateFrame.updatePosIndex(entity);
			});
	
			$.each(aProject.relationList, function(rIdx, relation) {
				aProject.updateLinking(relation.type, relation);
				if(aProject == _self) {
					_self.projectList[subTaskNameList[0]].annotateFrame.updatePosIndex(relation);
				}
				else
					aProject.annotateFrame.updatePosIndex(relation);
			});
		}
	});

	$.each(this.projectList, function(aIdx, aProject) {
		aProject.annotateFrame.generateAllAnnotateOverlapList();
	});
}

AnaforaCrossProject.prototype.getAObjFromID = function(id) {
	var valList = id.split("@");
	if(valList[2]  == this.task) {
		return AnaforaProject.prototype.getAObjFromID(id) 
	}
	else {
		return this.projectList[valList[2]].getAObjFromID(id);
	}

	
}

AnaforaCrossProject.prototype.removeAObj = function(delAObj) {
	if(delAObj.getTaskName() == this.task)
		AnaforaProject.prototype.removeAObj.call(this, delAObj);
	else
		this.projectList[delAObj.getTaskName()].removeAObj(delAObj);
}

AnaforaCrossProject.prototype.addAObj = function(newAObj) {
	this.projectList[newAObj.getTaskName()].addAObj(newAObj);
}

/*
AnaforaCrossProject.prototype.updateProperty = function(aObj, pIdx, value) {
	if(aObj instanceof Entity)
		this.projectList
	var annotFrame = this.getAnnotateFrame(aObj);

}
*/
