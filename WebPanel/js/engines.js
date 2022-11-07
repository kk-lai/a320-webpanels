require.config({
    baseUrl : '../../',
    paths : {
        jquery : '3rdparty/jquery/jquery-1.11.2.min',
        knockout : '3rdparty/knockout/knockout-3.4.0',
        fgcommand : 'lib/fgcommand',
        knockprops : 'lib/knockprops' 
    },
    waitSeconds : 30,
});

require([
        'knockout', 'jquery'
        ,'knockprops','fgcommand'
], function(ko, jquery
        ,knockprops, fgcommand
    ) {
        
    var refreshRate = 500; //500ms
    var koRefreshRate = 40;
    var nextRefreshTS = 0;
    var touchDevice = ('ontouchstart' in document.documentElement);
    
    function onLeverChanged(elm) {
        nextRefreshTS=Date.now()+refreshRate;
        var val=jquery(elm).attr("val");
        var engRev=[viewModel.eng0Rev(), viewModel.eng1Rev()];
        var engine = jquery(elm).hasClass("level-0") ? 0: 1;
        var prop = [
            "/controls/engines/engine/throttle",
            "/controls/engines/engine[1]/throttle"
        ];
        var mvar = [
            "eng0Throttle",
            "eng1Throttle"
        ];
        
        if (!engRev[engine]) {
            for(var i=0;i<2;i++) {
                if (viewModel.lock() || i==engine) {
                    fgcommand.propertyAssign(prop[i],val);
                    viewModel[mvar[i]](val);
                }
            }
        }
    }

    function resizeViewport() 
    {
        var w,h;
        ar=0.6645;

        w=window.innerWidth;
        h=window.innerHeight;
        
        if (w/h > ar) {
            w=h*ar;
        } else {
            h=w/ar;
        }

        jquery(".container").width(w);
        jquery(".container").height(h);
        
        jquery(".container").css("font-size",w/20);
        jquery(".container").css("visibility",'visible');
        
        jquery(".blk-thrust-bar").each(function(idx) {
            w=jquery(this).width();
            jquery(this).find("*.lvr-ctrl").height(w);
        });
    }
    
    function moveLevelFraction(elm, f) {
        var lvr=jquery(elm).find(".lvr-ctrl").first();
        var h=jquery(elm).height();
        var lh=jquery(lvr).height();
        
        var tpos=(1-f)*(h-lh);
        jquery(lvr).css('top',tpos.toString()+"px");
    }
    
    function moveLever(elm, e) {
        var x,y;
        if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend' || e.type == 'touchcancel'){
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            x = touch.pageX;
            y = touch.pageY;
        } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove' || e.type == 'mouseover'|| e.type=='mouseout' || e.type=='mouseenter' || e.type=='mouseleave') {
            x = e.clientX;
            y = e.clientY;
        }
        var pos=y;
        var lvr=jquery(elm).find(".lvr-ctrl").first();
        var h=jquery(elm).height();
        var lh=jquery(lvr).height();
        var hh=lh/2;
        var mh=h-hh;
        var val;
        
        pos=pos-jquery(elm).offset().top;
        
        // acceptable range
        if (pos<hh) {
            pos=hh;
        }
        if (pos>mh) {
            pos=mh;
        }
        
        val=1-(pos-hh)/(h-lh);
        jquery(elm).attr("val",val);
        
        var tpos=pos-hh;
        jquery(lvr).css('top',tpos.toString()+"px");
        
        var func=jquery(elm).attr("func");
        onLeverChanged(elm);
    }
    
    jquery(document).ready(function() {
        
        var ev;
        var evStart;
        var evEnd;
        var evMove;
        
        if (touchDevice) {
            ev='touchstart';
            evStart='touchstart';
            evMove='touchmove';
            evEnd='touchend';
        } else {
            ev='click';
            evStart='mousedown';
            evMove='mousemove';
            evEnd='mouseup mouseleave';
        }
        
        jquery(".ctl-thrust-lever").on(evStart,function(e) {
            jquery(this).attr("clicked",1);
            moveLever(this,e);
        });
        
        jquery(".ctl-thrust-lever").on(evMove,function(e) {
            
            var clicked=jquery(this).attr("clicked");
            if (clicked==1) {
                moveLever(this,e);
            }
            
        });
        
        jquery(".ctl-thrust-lever").on(evEnd,function(e) {
            jquery(this).attr("clicked",0);
        });        
        
        jquery(".btn-engine-mode").on(ev,function() {
            nextRefreshTS=Date.now()+refreshRate;
            var mode=parseInt(jquery(this).attr("mode"));
            fgcommand.propertyAssign("/controls/engines/engine-start-switch",mode);
            viewModel.engStartSwitch(mode);
        });
        
        jquery(".btn-eng-on").on(ev,function() {
            nextRefreshTS=Date.now()+refreshRate;
            var engine=parseInt(jquery(this).attr("engine"));
            var engineState=viewModel["eng"+engine]();
            var arrEngines=["engine","engine[1]"];
            
            fgcommand.propertyAssign("/controls/engines/"+arrEngines[engine]+"/cutoff-switch",!engineState);
            viewModel["eng"+engine](!engineState);
        });
        
        jquery(".btn-lock").on(ev,function() {
            var lock=viewModel.lock();
            viewModel.lock(!lock);
        });
        
        jquery(".btn-thrust").on(ev,function() {
            viewModel.lock(true);
            var cmd=jquery(this).attr("cmd");
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script',cmd));
        });

        resizeViewport();
        
    });
    
    jquery( window ).resize(function() {
        resizeViewport();
    });
  
    ko.options.deferUpdates = true;
    

    ko.utils.knockprops.setAliases({
        eng0:"/controls/engines/engine/cutoff-switch",
        eng1:"/controls/engines/engine[1]/cutoff-switch",
        engStartSwitch:"/controls/engines/engine-start-switch",
        eng0Throttle:"/controls/engines/engine/throttle",
        eng1Throttle:"/controls/engines/engine[1]/throttle",
        eng0Rev:"/controls/engines/engine/reverser",
        eng1Rev:"/controls/engines/engine[1]/reverser"
    });

    var viewModel = {
        eng0: ko.observable(true).extend({ rateLimit: koRefreshRate }),
        eng1: ko.observable(true).extend({ rateLimit: koRefreshRate }),
        engStartSwitch: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        lock: ko.observable(true).extend({ rateLimit: koRefreshRate }),
        eng0Throttle: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        eng1Throttle: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        eng0Rev:ko.observable(false).extend({ rateLimit: koRefreshRate }),
        eng1Rev:ko.observable(false).extend({ rateLimit: koRefreshRate })
    };
    
    ko.utils.knockprops.addListener('eng0',viewModel.eng0);
    ko.utils.knockprops.addListener('eng1',viewModel.eng1);
    ko.utils.knockprops.addListener('engStartSwitch',viewModel.engStartSwitch);
    ko.utils.knockprops.addListener('eng0Throttle',viewModel.eng0Throttle);
    ko.utils.knockprops.addListener('eng1Throttle',viewModel.eng1Throttle);
    ko.utils.knockprops.addListener('eng0Rev',viewModel.eng0Rev);
    ko.utils.knockprops.addListener('eng1Rev',viewModel.eng1Rev);
   
    var refreshProperties= function() {
        var ts = Date.now();
        if (ts>nextRefreshTS) {
            for(const p in ko.utils.knockprops.aliases) {
                //console.log(ko.utils.knockprops.aliases[p]);
                ko.utils.knockprops.ws.send(JSON.stringify({
                    command : 'get',
                    node : ko.utils.knockprops.aliases[p]
                }));
            }
            var lvr=jquery(".lever-0").first();
            var val=viewModel.eng0Throttle();
            
            moveLevelFraction(lvr, val);
            lvr=jquery(".lever-1").first();
            val=viewModel.eng1Throttle();
            moveLevelFraction(lvr, val);
            
            nextRefreshTS=ts+refreshRate;
            
        }
        setTimeout(refreshProperties, refreshRate);
    }
    
    viewModel.eng0Throttle.subscribe(function(nVal) {
        var lvr=jquery(".lever-0").first();
        moveLevelFraction(lvr, nVal);
    });
    
    viewModel.eng1Throttle.subscribe(function(nVal) {
        var lvr=jquery(".lever-1").first();
        moveLevelFraction(lvr, nVal);
    });

    setTimeout(refreshProperties, refreshRate);
    ko.applyBindings( viewModel);
    
});