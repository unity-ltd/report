'use strict';
import fs from 'fs'
import moment from 'moment';
import { resolve } from 'path';
import { think } from 'thinkjs';


module.exports = class extends think.Service {

  actionLabel(action) {
    if (!action) {
      return 'No extra action needed for maintenance'
    } else if (action === 'tenant_action_on_moveout') {
      return 'Tenant should take action before moving out'
    } else if (action === 'tenant_action_immediately') {
      return 'Tenant should take action immediately'
    } else if (action === 'owner_action_immediately') {
      return 'Owner is asked to resolve the issue immediately'
    }
  }

  addressForm(house_data) {
    if (!house_data.street) {
      return ''
    }
    return (house_data.unit)? `${house_data.unit}-${house_data.num} ${house_data.street} ${house_data.suburb} ${house_data.city}`
      : `${house_data.num} ${house_data.street} ${house_data.suburb} ${house_data.city}`
  }

  writeReport(docx, {account, house_data, task, activeLease, lastInspection}) {
    // console.log('writeReport: ', {account, house_data})
    var header = docx.getHeader().createP();
    header.options.align = 'center';
    header.addText('This report is generated by Unity Property Management Corporation');

    this._setDocLogo(docx)
    this._setInformation(docx, {account, task, house_data} );

    var pObj = docx.createP({ align: 'center' });
    pObj.addText('Property Inspection Report', { bold: true, font_face: 'Arial', font_size: 20 });
    // 水平分割线
    pObj.addLineBreak()

    var pObj = docx.createP();
    pObj.addText('General Information', { bold: true, font_face: 'Arial', font_size: 20 });

    // 检验报告日期
    var pObj = docx.createP();
    pObj.addText('Inspection Date : ');
    pObj.addText(moment.unix(task.timestamp).format('D MMM YYYY'), { bold: true, underline: true });
    // 房子地址
    var pObj = docx.createP();
    pObj.addText('Property Address : ');
    pObj.addText(this.addressForm(house_data), { bold: true, underline: true });
    /**
     * 租客信息 2019-12-11日，针对lease逻辑，在report中删除 租客信息
     */
    // 房屋开始入住日期
    if (activeLease) {
      var pObj = docx.createP();
      pObj.addText('Lease commencement date : ');
      pObj.addText(moment(activeLease.checkin_date).format('D MMM YYYY'), {
        bold: true,
        underline: true
      });
    }
    // 租金信息和交租频率
    var pObj = docx.createP();
    pObj.addText('Inspection frequency : ');
    pObj.addText(house_data.frequency || 3 + ' month', {
        bold: true,
        underline: true
    });
    // 上次查房日期
    var pObj = docx.createP();
    pObj.addText('Last inspection date : ');
    if (lastInspection) {
      pObj.addText(moment(lastInspection.timestamp * 1000).format('D MMM YYYY'), { bold: true, underline: true });
    } else {
      pObj.addText('N/A', { bold: true, underline: true });
    }
    // 水平分割线
    pObj.addLineBreak()
    // var pObj = docx.createP();
    // pObj.addHorizontalLine();

    docx.addPageBreak();
    var pObj = docx.createP();
    pObj.addText('Dear Property Owner', { bold: true, font_face: 'Arial', font_size: 30 });
    var pObj = docx.createP();
    pObj.addText('A property inspection has been performed at your property. This letter includes all photos and comments that were made on-site.');

    let summary = house_data.summary;
    if (!summary) {
      try {
        var summaryObj = JSON.parse(task.summary)
        if (summaryObj && summaryObj.description) {
          summary = summaryObj.description;
        }
      } catch (e) {
        summary = task.summary;
      }
    }
    if (summary) {
      var pObj = docx.createP();
      pObj.addText('There is a summary of this inspection:');
      pObj.addText(summary);
    }

    var pObj = docx.createP();
    pObj.addText('If there is anything you would like to discuss in regards to the inspection, please don\'t hesitate to contact our agency.');

    var pObj = docx.createP();
    pObj.addText('Kind regards,');

    var pObj = docx.createP();
    pObj.addText('Your Property Manager');

    const pm = task.house? task.house.pm : null;
    if (pm) {
      var pObj = docx.createP();
      pObj.addText(pm.account);
      pObj.addText(pm.phone);
      pObj.addText(pm.email);
    }

    let rooms = house_data.room || [];
    // console.log('rooms: ', rooms)
    this._addRooms(docx, task, rooms);

    docx.addPageBreak()
    var pObj = docx.createP();
    pObj.addText('Disclaimer: This report was undertaken by the agent for the owner of the property and should not be considered as a licensed building report or a licensed pest inspection');

    var pObj = docx.createP();
    pObj.addText('');
  }


  _addRooms(docx, task, rooms) {

    let actions = []

    // console.log(`${rooms.length} rooms`)
    for (const room of rooms) {
      // console.log(`${room.name} has ${room.areas.length} areas`)
      let areas = room.areas;
      for (const area of areas) {
        // console.log('      ', area.area)
        if (!think.isEmpty(area.action) && !think.isEmpty(area.status) && area.status != 'CLEAN') {
          const issue = `${room.name}/${area.area} - ${area.status}: ${this.actionLabel(area.action)}`
          actions.push(issue);
          // console.log(issue)
        }
      }
    }
    // console.dir({actions})

    const pathHelper = think.service('pathHelper');
    if (actions.length > 0) {
      var pObj = docx.createP();
      pObj.addText('Issues', { bold: true, font_face: 'Arial', font_size: 30 });
      for (const action of actions) {
        var pObj = docx.createP();
        pObj.addText(action);
      }
    }
    docx.addPageBreak()

    // console.log('start rooms')
    for (const room of rooms) {
        let areas = room.areas;
        console.log("generate report room = ", room.name);
        // 添加 Room 名称
        var pObj = docx.createP();
        pObj.addText(room.name, { bold: true, font_face: 'Arial', font_size: 20 });
        console.log(room.name)

        // 添加 Area 信息 图片信息
        for (const area of areas) {
          // console.log("generate report area = ", {area});
          // if (think.isEmpty(area.status) && think.isEmpty(area.note) && area.img.length == 0) {
          //       continue;
          //   }
            var pObj = docx.createP();
            pObj.addLineBreak()
            pObj.addLineBreak()
            if (!think.isEmpty(area.status)) {
                pObj.addText(`Area:  ${area.area}       Status: ${area.status}`);
            } else {
                pObj.addText(`Area:  ${area.area}       Status: N/A`);
            }

            if (!think.isEmpty(area.note)) {
                var pObj = docx.createP();
                pObj.addText(`Note:  ${area.note}`);
            } else {
                // 如果没有Note  放一空行
                var pObj = docx.createP();
                pObj.addText('Note: N/A');
            }

            if (!think.isEmpty(area.action)) {
              var pObj = docx.createP();
              pObj.addText(`Action: ${this.actionLabel(area.action)}`);
            }

            pObj = docx.createP({ align: 'center' });
            const noImg = resolve(think.ROOT_PATH + '/src/static/image', 'noimage.png');
            for (const [index,imgObj] of area.img.entries()) {
              try {
                const filename = pathHelper.getFilename(imgObj.file_url)
                const link = pathHelper.getGlobalPath(task, filename);
                const option = { cx: 150, cy: 220, link }
                const compressed = pathHelper.getThrumbnailPath(task, filename);
                const localPath = pathHelper.getLocalPath(task, 'images', filename);
                if (fs.existsSync(compressed)) {
                  pObj.addImage(compressed, option);
                } else if (fs.existsSync(localPath)) {
                  pObj.addImage(localPath, option);
                // } else {
                //   pObj.addImage(noImg, option);
                }
              } catch (error) {
                console.log('exception adding images: ', error)
                pObj.addImage(noImg, { cx: 150, cy: 220 });
              }
              if ((index+1)%3 === 0) {
                pObj = docx.createP({ align: 'center' });
              }
            }
            if (area.img.length <= 0) {
              pObj.addImage(noImg, { cx: 150, cy: 220 });
            }

            // 水平分割线
            pObj = docx.createP()
        }
    }
  }

  _setInformation(docx, {account, task, house_data}) {
      var pObj = docx.createP({ align: 'left' });
      pObj = docx.createP({ align: 'left' });
      pObj.addText('Unity Property Management Ltd');
      pObj = docx.createP({ align: 'left' });
      pObj.addText('Inspector:' + account.account);
      pObj = docx.createP({ align: 'left' });
      pObj.addText('Email:' + account.email);
      pObj = docx.createP({ align: 'left' });
      pObj.addText('Phone:' + account.phone);
      pObj.addLineBreak();

      // pObj = docx.createP({ align: 'center' });
      // pObj.addText('Dear Property Owner', { bold: true, font_face: 'Arial', font_size: 20 });
      // pObj = docx.createP({ align: 'left' });
      // pObj.addText(`A property inspection has been performed at your property. This letter includes all photos and comments that were made on-site.`);

      // pObj = docx.createP({ align: 'left' });
      // pObj.addText(`Kind regards,`);
      // pObj.addText(`Your Property Manager`);
  }

  _setDocLogo(docx) {
		var pObj = docx.createP({ align: 'left' });
		let logo = resolve(think.ROOT_PATH + '/src/static/image', 'logo.jpeg');
		pObj.addImage(logo, { cx: 300, cy: 150 });
		pObj.addLineBreak();
  }

}
