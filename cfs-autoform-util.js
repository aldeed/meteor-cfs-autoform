Util = {
  //delete prop from obj
  //prop can be something like "obj.3.badprop
  deepDelete: function(obj, prop){
    return CfsAutoForm.Util.deepDo(obj, prop, function(obj, prop){
      delete obj[prop];
    });
  },
  deepSet: function(obj, prop, value){
    return CfsAutoForm.Util.deepDo(obj, prop, function(obj, prop){
      obj[prop] = value;
    });
  },
  //returns the object that CONTAINS the last property
  deepFind: function(obj, path){
    path = path.split('.');
    for (i = 0; i < path.length - 1; i++)
      obj = obj[path[i]];

    return obj;
  },
  //executes closure(obj, prop) where prop might be a string of properties and array indices
  deepDo: function(obj, path, closure){
    path = path.split('.');
    for (i = 0; i < path.length - 1; i++)
      obj = obj[path[i]];

    closure.apply(this, [obj, path[i]]);
  }
};
