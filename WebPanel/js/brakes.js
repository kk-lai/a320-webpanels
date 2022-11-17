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
        
    
    var touchDevice = false;
    var refreshRate = 500; //500ms
    var koRefreshRate = 40;
    var nextRefreshTS = 0;
    var targetFlaps = -1;
    var flapChangeDelay=1000; // 1sec
    var flapsTimer = null;

    function resizeViewport() 
    {
        var w,h;
        ar=2.138;

        w=window.innerWidth;
        h=window.innerHeight;
        
        if (w/h > ar) {
            w=h*ar;
        } else {
            h=w/ar;
        }

        jquery(".container").width(w);
        jquery(".container").height(h);
        
        jquery(".container").css("font-size",w/57);
        jquery(".container").css("visibility",'visible');
    }
    
    var setFlaps=function() {
        var flapsPos=viewModel.flapsPos();
        if (flapsPos==1) {
            flapsPos=2;
        }
        if (flapsPos==targetFlaps) {
            clearTimeout(flapsTimer);
            targetFlaps=-1;
            flapsTimer=null;
            return;
        }
        var dir;
        if (flapsPos<targetFlaps) {
            dir=1;
        } else {
            dir=-1;
        }
        fgcommand.sendCommand('nasal',fgcommand.oneArg('script','controls.flapsDown('+dir+')'));
        flapsTimer=setTimeout(setFlaps, flapChangeDelay);
    }
    
    var refreshProperties= function() {
        var ts = Date.now();
        
        if (ts>nextRefreshTS) {
            for(const p in ko.utils.knockprops.aliases) {
                //console.log(ko.utils.knockprops.aliases[p]);
                if (ts<=nextRefreshTS) {
                    break;
                }
                ko.utils.knockprops.ws.send(JSON.stringify({
                    command : 'get',
                    node : ko.utils.knockprops.aliases[p]
                }));
            }
            nextRefreshTS=ts+refreshRate;
        }
        setTimeout(refreshProperties, refreshRate);
    }
    
    jquery(document).ready(function() {
        var touchDevice = ('ontouchstart' in document.documentElement);
        var ev;
        if (touchDevice) {
            ev='touchstart';
        } else {
            ev='click';
        }
        resizeViewport();
        
        jquery(".btn-parkbrk").on(ev, function() {
            var nval=1-viewModel.prkbrk();
            script='controls.applyParkingBrake(1)';      
            nextRefreshTS=Date.now()+refreshRate;
            viewModel.prkbrk(nval);
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script',script));        
        });

        jquery(".btn-flaps").on(ev, function() {        
            var mag=parseInt(jquery(this).attr("mag"));
            targetFlaps=mag;
            if (flapsTimer==null) {
                setFlaps();
            }
        });
        
        jquery(".btn-speedbrk").on(ev, function() {
            var mag=parseInt(jquery(this).attr("mag"));
            var sbrkarm=false;
            var sbrk=0;
            if (mag<0) {
                sbrk=0;
                sbrkarm=true;
            } else {
                sbrkarm=false;
                sbrk=mag/100;
            }
            viewModel.speedbrk(sbrk);
            viewModel.speedbrkarm(sbrkarm);
            fgcommand.propertyAssign("/controls/flight/speedbrake-arm",sbrkarm);
            fgcommand.propertyAssign("/controls/flight/speedbrake",sbrk);
        });
        
        jquery(".tbtn").on(ev, function() {
            var mag=parseInt(jquery(this).attr("mag"));
            var mode=viewModel.tmode()+mag;
            if (mode<0) {
                mode=5+mode;
            } else {
                mode=mode%5;
            }
            viewModel.tmode(mode);
            fgcommand.propertyAssign("/controls/atc/mode-knob",mode);
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','atc.transponderPanel.modeSwitch('+(mode+1)+')'));
        });
        
        jquery(".btn-abrk").on(ev, function() {
            var mag=parseInt(jquery(this).attr("mag"));
            if (viewModel.abrkmode()==mag) {
                mag=0;
            }
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','systems.Autobrake.arm_autobrake('+mag+')'));
        });
        
        jquery('.btn-brkfan').on(ev, function() {
            var nval=!viewModel.brkfan();
            viewModel.brkfan(nval);
            fgcommand.propertyAssign("/controls/gear/brake-fans",nval);
        });
        
        jquery(".btn-gear").on(ev, function() {
            var mag=parseInt(jquery(this).attr("mag"));
            fgcommand.sendCommand('nasal',fgcommand.oneArg('script','controls.gearDown('+mag+')'));
        });
    });
    
    jquery( window ).resize(function() {
        resizeViewport();
    });
    
    ko.options.deferUpdates = true;
    ko.utils.knockprops.setAliases({
        prkbrk:"/controls/gear/brake-parking",
        flapsPos: "/controls/flight/flaps-pos",
        tmode:"/controls/atc/mode-knob",
        speedbrkarm:"/controls/flight/speedbrake-arm",
        speedbrk:"/controls/flight/speedbrake",
        abrkmode:"/controls/autobrake/mode",
        brkfan:"/controls/gear/brake-fans",
        l1brktemp:"/gear/gear[1]/L1brake-temp-degc",
        l2brktemp:"/gear/gear[1]/L2brake-temp-degc",
        r1brktemp:"/gear/gear[2]/R3brake-temp-degc",
        r2brktemp:"/gear/gear[2]/R4brake-temp-degc",
        gearDown:"/controls/gear/gear-down"
    });

    var viewModel = {
        prkbrk: ko.observable(1).extend({ rateLimit: koRefreshRate }),
        flapsPos: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        tmode: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        speedbrkarm: ko.observable(false).extend({ rateLimit: koRefreshRate }),
        speedbrk: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        abrkmode: ko.observable(0).extend({ rateLimit: koRefreshRate }),
        brkfan:ko.observable(false).extend({ rateLimit: koRefreshRate }),
        l1brktemp: ko.observable(0.0).extend({ rateLimit: koRefreshRate }),
        l2brktemp: ko.observable(0.0).extend({ rateLimit: koRefreshRate }),
        r1brktemp: ko.observable(0.0).extend({ rateLimit: koRefreshRate }),
        r2brktemp: ko.observable(0.0).extend({ rateLimit: koRefreshRate }),
        gearDown:ko.observable(true).extend({ rateLimit: koRefreshRate })
    };
    
    ko.utils.knockprops.addListener('prkbrk',viewModel.prkbrk);
    ko.utils.knockprops.addListener('flapsPos',viewModel.flapsPos);
    ko.utils.knockprops.addListener('tmode',viewModel.tmode);
    ko.utils.knockprops.addListener('speedbrkarm',viewModel.speedbrkarm);
    ko.utils.knockprops.addListener('speedbrk',viewModel.speedbrk);
    ko.utils.knockprops.addListener('abrkmode',viewModel.abrkmode);
    ko.utils.knockprops.addListener('brkfan',viewModel.brkfan);
    ko.utils.knockprops.addListener('l1brktemp',viewModel.l1brktemp);
    ko.utils.knockprops.addListener('l2brktemp',viewModel.l2brktemp);
    ko.utils.knockprops.addListener('r1brktemp',viewModel.r1brktemp);
    ko.utils.knockprops.addListener('r2brktemp',viewModel.r2brktemp);
    ko.utils.knockprops.addListener('gearDown',viewModel.gearDown);
    
    viewModel.brkfanHotInd = ko.pureComputed(function() {
        return (this.l1brktemp() > 300 || this.l2brktemp() > 300 || this.r1brktemp() > 300 || this.r2brktemp() > 300);
    },viewModel);
    
    setTimeout(refreshProperties, refreshRate);
    
    ko.applyBindings( viewModel);
});