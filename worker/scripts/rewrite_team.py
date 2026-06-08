import re
import os

os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

files = {
    "team/sony-miltar.html": {
        "oldName": "Sony Miltar",
        "newName": "Rohidas R. Sharma",
        "newJob": "Managing Director",
        "newDept": "Management",
        "newExp": "26+",
        "newQual": "Mechanical Engineering",
        "newMetaDesc": "Rohidas R. Sharma, Managing Director at HI-NOVA APEX LLP. Mechanical engineering background with more than 26 years of experience in strategic planning, operational management, and team development.",
        "newDesc": "Mechanical engineering professional with more than 26 years of experience, leading the organisation with expertise in strategic planning, operational management, and team development.",
        "newProfile": "Rohidas R. Sharma is the Managing Director of HI-NOVA APEX LLP. With a strong mechanical engineering background and more than 26 years of industry experience, he provides the strategic direction and leadership that drives the organisation forward.",
        "newExpertise": ["Mechanical engineering background", "More than 26 years of experience", "Expertise in strategic planning, operational management, and team development"],
    },
    "team/connor-grimes.html": {
        "oldName": "Connor Grimes",
        "newName": "Manoj A. P",
        "newJob": "Director",
        "newDept": "Engineering",
        "newExp": "15+",
        "newQual": "Chemical Engineering",
        "newMetaDesc": "Manoj A. P, Director at HI-NOVA APEX LLP. Chemical engineering expertise leading engineering strategy and innovation with a focus on scalable and compliant process systems.",
        "newDesc": "Chemical engineering expert leading engineering strategy and innovation, with a focus on building scalable and compliant process systems.",
        "newProfile": "Manoj A. P serves as Director at HI-NOVA APEX LLP. He brings deep chemical engineering expertise and leads the company's engineering strategy and innovation efforts.",
        "newExpertise": ["Chemical engineering expertise", "Leads engineering strategy and innovation", "Focus on scalable and compliant process systems"],
    },
    "team/jake-nicholson.html": {
        "oldName": "Jake Nicholson",
        "newName": "Vishal Sakat",
        "newJob": "Production Head",
        "newDept": "Production",
        "newExp": "9+",
        "newQual": "Logistics & Supply Chain Management",
        "newMetaDesc": "Vishal Sakat, Production Head at HI-NOVA APEX LLP. Mechanical engineering background with 9+ years in fabrication of pressure vessels, reactors, and process equipment.",
        "newDesc": "Mechanical engineer with a degree in Logistics and Supply Chain Management and 9+ years in fabrication of pressure vessels, reactors, and process equipment. ASNT Level II certified in RT and LPT.",
        "newProfile": "Vishal Sakat is the Production Head at HI-NOVA APEX LLP. He combines a mechanical engineering background with a degree in Logistics and Supply Chain Management to oversee fabrication operations and quality.",
        "newExpertise": ["Mechanical engineering background", "Degree in Logistics & Supply Chain Management", "9+ years in fabrication of pressure vessels, reactors, and process equipment", "ASNT Level II certified in RT and LPT"],
    },
    "team/bettie-schinner.html": {
        "oldName": "Bettie Schinner",
        "newName": "Hardik Panchal",
        "newJob": "Marketing Head",
        "newDept": "Marketing",
        "newExp": "10",
        "newQual": "Mechanical Engineering",
        "newMetaDesc": "Hardik Panchal, Marketing Head at HI-NOVA APEX LLP. Mechanical engineer with 10 years of experience, responsible for marketing strategy and business development.",
        "newDesc": "Mechanical engineer with 10 years of experience, responsible for marketing strategy and business development at HI-NOVA APEX LLP.",
        "newProfile": "Hardik Panchal leads Marketing at HI-NOVA APEX LLP. A mechanical engineer by training, he brings 10 years of experience to shaping the company's marketing strategy and driving business development.",
        "newExpertise": ["Mechanical Engineer", "10 years of experience", "Responsible for marketing strategy and business development"],
    },
    "team/marko-daniel.html": {
        "oldName": "Marko Daniel",
        "newName": "Arvind Kumar Sharma",
        "newJob": "Director",
        "newDept": "Engineering",
        "newExp": "20+",
        "newQual": "Mechanical Engineering",
        "newMetaDesc": "Arvind Kumar Sharma, Director at HI-NOVA APEX LLP. Experienced engineering leader with 20+ years in industrial equipment design, project execution, and quality assurance.",
        "newDesc": "Experienced engineering leader with 20+ years in industrial equipment design, project execution, and quality assurance across process industries.",
        "newProfile": "Arvind Kumar Sharma serves as Director at HI-NOVA APEX LLP. With extensive experience in mechanical engineering and industrial project management, he oversees engineering excellence and project delivery.",
        "newExpertise": ["20+ years in industrial equipment design", "Expertise in project execution and quality assurance", "Leadership across process industries"],
    },
    "team/robert-jhonson.html": {
        "oldName": "Robert Jhonson",
        "newName": "HI-NOVA Engineering Team",
        "newJob": "Quality & Inspection",
        "newDept": "Quality Assurance",
        "newExp": "26+",
        "newQual": "ISO 9001:2015 & IBR Certified",
        "newMetaDesc": "HI-NOVA Engineering Team - Quality & Inspection at HI-NOVA APEX LLP. ISO 9001:2015 and IBR certified quality and inspection services.",
        "newDesc": "The HI-NOVA engineering team delivers ISO 9001:2015 and IBR certified quality and inspection services, ensuring every product meets the highest industry standards.",
        "newProfile": "The HI-NOVA Engineering Team manages quality assurance and inspection across all projects. Their rigorous processes ensure compliance with international standards including ISO 9001:2015 and IBR certifications.",
        "newExpertise": ["ISO 9001:2015 & IBR Certified processes", "Rigorous quality assurance and inspection", "Compliance with international standards"],
    },
}

for filepath, info in files.items():
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    old = info["oldName"]
    new = info["newName"]

    # Title
    content = content.replace(
        f"<title>{old} | Induztry - Webflow HTML website template</title>",
        f"<title>{new} | HI-NOVA APEX LLP</title>"
    )

    # Meta og:title and twitter:title
    content = re.sub(
        rf'<meta content="{re.escape(old)} \| Induztry - Webflow HTML website template" property="og:title">',
        f'<meta content="{new} | HI-NOVA APEX LLP" property="og:title">',
        content
    )
    content = re.sub(
        rf'<meta content="{re.escape(old)} \| Induztry - Webflow HTML website template" property="twitter:title">',
        f'<meta content="{new} | HI-NOVA APEX LLP" property="twitter:title">',
        content
    )

    # Template descriptions
    template_descs = [
        "Debitis sit assumenda officiis quia excepturi velit perspiciatis Alias id quidem maiores non dolorem.",
        "Debitis sit assumenda officiis quia excepturi velit perspiciatis Alias id quidem ut amet maiores non dolorem.",
        "Dolores officiis libero recusandae adipisci. Iusto velit recusandae aut quasi cupiditate ut tempore nihil.",
        "Repellat quos eveniet est earum labore. Cum ut enim. Tempore sunt distinctio sunt et ea tenetur eius. ",
        "Impedit facilis sapiente perferendis sit similique. Doloribus id perspiciatis laboriosam qui odit.",
    ]
    for td in template_descs:
        content = content.replace(
            f'<meta content="{td}" name="description">',
            f'<meta content="{info["newMetaDesc"]}" name="description">'
        )
        content = content.replace(
            f'<meta content="{td}" property="og:description">',
            f'<meta content="{info["newMetaDesc"]}" property="og:description">'
        )
        content = content.replace(
            f'<meta content="{td}" property="twitter:description">',
            f'<meta content="{info["newMetaDesc"]}" property="twitter:description">'
        )

    # JSON-LD name
    content = content.replace(f'"name": "{old}",', f'"name": "{new}",')
    content = content.replace(f'"name": "{old}"', f'"name": "{new}"')

    # JSON-LD jobTitle
    job_replacements = {
        '"jobTitle": "Industrial Manager"': f'"jobTitle": "{info["newJob"]}"',
        '"jobTitle": "Team Manager"': f'"jobTitle": "{info["newJob"]}"',
        '"jobTitle": "Sr. Engineer"': f'"jobTitle": "{info["newJob"]}"',
        '"jobTitle": "Site Manager"': f'"jobTitle": "{info["newJob"]}"',
        '"jobTitle": "Cheif Officer"': f'"jobTitle": "{info["newJob"]}"',
        '"jobTitle": "CEO of Industry"': f'"jobTitle": "{info["newJob"]}"',
    }
    for old_jt, new_jt in job_replacements.items():
        content = content.replace(old_jt, new_jt)

    # JSON-LD: replace descriptions
    content = re.sub(r'"description": "Debitis[^"]*"', f'"description": "{info["newDesc"]}"', content)
    content = re.sub(r'"description": "Dolores[^"]*"', f'"description": "{info["newDesc"]}"', content)
    content = re.sub(r'"description": "Repellat[^"]*"', f'"description": "{info["newDesc"]}"', content)
    content = re.sub(r'"description": "Impedit[^"]*"', f'"description": "{info["newDesc"]}"', content)

    # JSON-LD: replace emails
    email_replacements = {
        '"email": "sonymiltar@yahoo.com"': f'"email": "enquiry@hinovaapex.com"',
        '"email": "connor-grimes@yahoo.com"': f'"email": "enquiry@hinovaapex.com"',
        '"email": "jakenicholson@gmail.com"': f'"email": "enquiry@hinovaapex.com"',
        '"email": "bettieschinner@gmail.com"': f'"email": "enquiry@hinovaapex.com"',
        '"email": "markodaniel@gmail.com"': f'"email": "enquiry@hinovaapex.com"',
        '"email": "robert@email.com"': f'"email": "enquiry@hinovaapex.com"',
    }
    for old_e, new_e in email_replacements.items():
        content = content.replace(old_e, new_e)

    # JSON-LD: replace telephones
    content = content.replace('"telephone": "+1 130 448 741"', '"telephone": "+91 91123 13669"')
    content = content.replace('"telephone": "+1 105 779 884"', '"telephone": "+91 91123 13669"')
    content = content.replace('"telephone": "+1 143 670 381"', '"telephone": "+91 91123 13669"')
    content = content.replace('"telephone": "+1 132 267 358"', '"telephone": "+91 91123 13669"')
    content = content.replace('"telephone": "+1 167 536 718"', '"telephone": "+91 91123 13669"')

    # JSON-LD: replace worksFor
    content = content.replace('"name": "Induztry"', '"name": "HI-NOVA APEX LLP"')

    # Visible: team-details-title
    content = content.replace(f'<div class="team-details-title">{old}</div>', f'<div class="team-details-title">{new}</div>')

    # Visible: team-designation
    desig_replacements = {
        '<div class="team-designation">Industrial Manager</div>': f'<div class="team-designation">{info["newJob"]}</div>',
        '<div class="team-designation">Team Manager</div>': f'<div class="team-designation">{info["newJob"]}</div>',
        '<div class="team-designation">Sr. Engineer</div>': f'<div class="team-designation">{info["newJob"]}</div>',
        '<div class="team-designation">Site Manager</div>': f'<div class="team-designation">{info["newJob"]}</div>',
        '<div class="team-designation">Cheif Officer</div>': f'<div class="team-designation">{info["newJob"]}</div>',
        '<div class="team-designation">CEO of Industry</div>': f'<div class="team-designation">{info["newJob"]}</div>',
    }
    for old_d, new_d in desig_replacements.items():
        content = content.replace(old_d, new_d)

    # Visible desc
    content = re.sub(r'<div class="team-detail-desc white-desc-text">Debitis[^<]*</div>',
                     f'<div class="team-detail-desc white-desc-text">{info["newDesc"]}</div>', content)
    content = re.sub(r'<div class="team-detail-desc white-desc-text">Dolores[^<]*</div>',
                     f'<div class="team-detail-desc white-desc-text">{info["newDesc"]}</div>', content)
    content = re.sub(r'<div class="team-detail-desc white-desc-text">Repellat[^<]*</div>',
                     f'<div class="team-detail-desc white-desc-text">{info["newDesc"]}</div>', content)
    content = re.sub(r'<div class="team-detail-desc white-desc-text">Impedit[^<]*</div>',
                     f'<div class="team-detail-desc white-desc-text">{info["newDesc"]}</div>', content)

    # Visible: department/experience values
    dept_replacements = {
        'white-desc-text">Manager</div>': f'white-desc-text">{info["newDept"]}</div>',
        'white-desc-text">Engineer</div>': f'white-desc-text">{info["newDept"]}</div>',
        'white-desc-text">CEO</div>': f'white-desc-text">{info["newDept"]}</div>',
    }
    for old_dept, new_dept in dept_replacements.items():
        content = content.replace(old_dept, new_dept)

    exp_replacements = {
        'white-desc-text">18</div>': f'white-desc-text">{info["newExp"]}</div>',
        'white-desc-text">10</div>': f'white-desc-text">{info["newExp"]}</div>',
        'white-desc-text">7</div>': f'white-desc-text">{info["newExp"]}</div>',
        'white-desc-text">13</div>': f'white-desc-text">{info["newExp"]}</div>',
        'white-desc-text">2</div>': f'white-desc-text">{info["newExp"]}</div>',
        'white-desc-text">4</div>': f'white-desc-text">{info["newExp"]}</div>',
    }
    for old_exp, new_exp in exp_replacements.items():
        content = content.replace(old_exp, new_exp)

    # Visible: email displays
    email_display = {
        '>sonymiltar@yahoo.com<': '>enquiry@hinovaapex.com<',
        '>connor-grimes@yahoo.com<': '>enquiry@hinovaapex.com<',
        '>jakenicholson@gmail.com<': '>enquiry@hinovaapex.com<',
        '>bettieschinner@gmail.com<': '>enquiry@hinovaapex.com<',
        '>markodaniel@gmail.com<': '>enquiry@hinovaapex.com<',
        '>robert@email.com<': '>enquiry@hinovaapex.com<',
    }
    for old_ed, new_ed in email_display.items():
        content = content.replace(old_ed, new_ed)

    # Visible: mailto/tel links
    link_replacements = {
        'mailto:sonymiltar@yahoo.com': 'mailto:enquiry@hinovaapex.com',
        'mailto:connor-grimes@yahoo.com': 'mailto:enquiry@hinovaapex.com',
        'mailto:jakenicholson@gmail.com': 'mailto:enquiry@hinovaapex.com',
        'mailto:bettieschinner@gmail.com': 'mailto:enquiry@hinovaapex.com',
        'mailto:markodaniel@gmail.com': 'mailto:enquiry@hinovaapex.com',
        'mailto:robert@email.com': 'mailto:enquiry@hinovaapex.com',
        'tel:+1130448741': 'tel:+919112313669',
        'tel:+1105779884': 'tel:+919112313669',
        'tel:+1143670381': 'tel:+919112313669',
        'tel:+1132267358': 'tel:+919112313669',
        'tel:+1167536718': 'tel:+919112313669',
    }
    for old_l, new_l in link_replacements.items():
        content = content.replace(old_l, new_l)

    # Replace visible profile/richtext section
    old_profile = re.search(r'<h5><strong>Personal information</strong></h5>.*?</div></div></div></div></section>', content, re.DOTALL)
    if old_profile:
        expertise_li = "\n".join([f"<li>{e}</li>" for e in info["newExpertise"]])
        new_profile = f'<h5><strong>Profile</strong></h5><p>{info["newProfile"]}</p><h5><strong>Expertise</strong></h5><ul role="list">{expertise_li}</ul></div></div></div></div></section>'
        content = content[:old_profile.start()] + new_profile + content[old_profile.end():]

    # Replace visible img alt
    content = content.replace(f'alt="{old}"', f'alt="{new}"')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Rewrote {filepath}: {old} -> {new}")
