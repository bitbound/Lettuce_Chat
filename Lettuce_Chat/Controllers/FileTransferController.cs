using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;

// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Lettuce_Chat.Controllers
{
    public class FileTransferController : Controller
    {
        // GET: /<controller>/
        [HttpGet]
        public IActionResult Download()
        {
            return new JsonResult("");
        }

        [HttpPost]
        public IActionResult Upload()
        {
            return new JsonResult("");
        }
    }
}
