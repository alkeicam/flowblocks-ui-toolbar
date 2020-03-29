class Defaults {
    constructor(options) {        
            this.SIZE = {
                width: 70,
                height: 70
            },
            this.LABEL = {
                FONT: {
                    SIZE: 0.15,
                    FAMILY: 'Helvetica',
                    WEIGHT: 'bold'
                }
            },
            this.POSITION = { 
                x: 40, 
                y: 20
            },
            this.POSITION_DELTA = {
                dx: 50,
                dy: 50
            }
            this.STYLE = 'americana'
            this.STYLES = {
                'americana': {                    
                    bodyColor: '#74b9ff',
                    titleBarColor: '#ffeaa7',
                    statusBarColor: '#fdcb6e',
                    portInColor: '#00cec9',
                    portOutColor: '#ff7675',
                    validationERRORColor: '#d63031',
                    validationOKColor: '#00b894'
                    
                },
                'original':{
                    bodyColor: '#3DB5FF',
                    titleBarColor: 'rgb(255, 230, 206)',
                    statusBarColor: 'rgb(209, 226, 208)',
                    portInColor: '#16A085',
                    portOutColor: '#E74C3C',
                    validationERRORColor: '#950952',
                    validationOKColor: '#008D83'
                },
                'cream' : {
                    bodyColor: '#FAE8FF',
                    titleBarColor: '#E1C2ED',
                    statusBarColor: '#E1C2ED',
                    portInColor: '#936DED',
                    portOutColor: '#F2EAD7',
                    validationERRORColor: '#950952',
                    validationOKColor: '#008D83'
                }
            }       
            this.TOOLBAR = {
                SIZE: {
                    width: 110,
                    height: 110
                },
                PADDING: {
                    x: 20,
                    y: 20
                },
                ROW_PADDING: 30,
                FONT: {
                    SIZE: 0.15,
                    FAMILY: 'Helvetica',
                    WEIGHT: 'bold'
                },
                DRAG: {
                    SIZE: {
                        width: 150,
                        height: 150
                    }
                }

            }
    }    
}
module.exports = new Defaults({});